/* ============================================================
   Aqua Well Spring · COMPORTAMIENTO
   ------------------------------------------------------------
   JavaScript plano, sin librerías ni dependencias. Se apoya en
   atributos data-* del HTML, así que puedes mover o duplicar
   secciones sin tocar este archivo:

     data-i18n="clave"        texto que cambia con el idioma
     data-i18n-list="nombre"  <template> que se repite por cada item
     data-lang="es|en"        botón del selector de idioma
     data-ref="nombre"        elemento que el JS necesita localizar
     data-action="nombre"     botón con una acción asociada
     data-promo               capa del popup promocional
     data-rail                carril horizontal con scroll-snap
     data-reveal="off"        se pone en un elemento que NO debe animarse

   Los textos están en content.js. Aquí no hay copy.
   ============================================================ */

(function () {
  'use strict';

  var C = window.AWS_CONTENT;
  if (!C) { console.error('[AWS] falta content.js'); return; }

  var CFG = C.ajustes || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var ref = function (name) { return $('[data-ref="' + name + '"]'); };
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════ 1. IDIOMA ══════════════════ */

  var idioma = CFG.idiomaPorDefecto || 'es';

  function pintarLista(nombre) {
    var tpl = $('[data-i18n-list="' + nombre + '"]');
    if (!tpl || tpl.tagName !== 'TEMPLATE') return;
    var host = tpl.parentElement;
    var datos = C[idioma][nombre] || [];
    $$('[data-generado="' + nombre + '"]', host).forEach(function (n) { n.remove(); });
    datos.forEach(function (item) {
      var nodo = tpl.content.cloneNode(true).firstElementChild;
      if (!nodo) return;
      nodo.setAttribute('data-generado', nombre);
      if (typeof item === 'string') {
        var slot = $('[data-slot="text"]', nodo);
        if (slot) slot.textContent = item;
      } else {
        Object.keys(item).forEach(function (k) {
          var s = $('[data-slot="' + k + '"]', nodo);
          if (s) s.textContent = item[k];
        });
      }
      host.insertBefore(nodo, tpl);
    });
  }

  function aplicarIdioma(cod) {
    if (!C[cod]) return;
    idioma = cod;
    var textos = C[cod];
    $$('[data-i18n]').forEach(function (el) {
      var v = textos[el.getAttribute('data-i18n')];
      if (typeof v === 'string') el.textContent = v;
    });
    pintarLista('benefits');
    pintarLista('faqs');
    $$('.lang-pill').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-lang') === cod);
    });
    document.documentElement.setAttribute('lang', cod);
    document.documentElement.setAttribute('data-aws-lang', cod);
    try { localStorage.setItem('aws-lang', cod); } catch (e) {}
  }

  $$('.lang-pill').forEach(function (b) {
    b.addEventListener('click', function () { aplicarIdioma(b.getAttribute('data-lang')); });
  });

  /* ══════════════════ 2. CINTA DE CIUDADES ══════════════════ */

  (function ciudades() {
    var cintas = $$('[data-marquee]');
    if (!cintas.length || !C.ciudades) return;
    cintas.forEach(function (cinta) {
      var grupo = cinta.firstElementChild;
      if (!grupo) return;
      var claseGrupo = grupo.className;
      var claseItem = grupo.firstElementChild ? grupo.firstElementChild.className : '';
      cinta.innerHTML = '';
      // dos grupos idénticos seguidos: la animación desplaza el 50% del ancho,
      // así el bucle es continuo y no se ve el salto al reiniciar
      for (var pasada = 0; pasada < 2; pasada++) {
        var g = document.createElement('div');
        g.className = claseGrupo;
        C.ciudades.forEach(function (nombre) {
          var s = document.createElement('span');
          if (claseItem) s.className = claseItem;
          s.textContent = nombre;
          g.appendChild(s);
        });
        cinta.appendChild(g);
      }
    });
  })();

  /* ══════════════════ 3. VÍDEO DEL HERO ══════════════════ */

  (function heroVideo() {
    var a = ref('heroA'), b = ref('heroB');
    if (!a) return;

    // Importante: `muted` y `loop` deben fijarse como PROPIEDADES.
    // Como atributos no siempre se reflejan, y un vídeo sin mutear
    // no puede reproducirse solo: el navegador bloquea el play().
    [a, b].forEach(function (v) {
      if (!v) return;
      v.muted = true;
      v.playsInline = true;
    });
    a.loop = true;

    var arrancar = function () {
      var activo = (b && b.style.opacity === '1') ? b : a;
      activo.muted = true;
      if (activo.paused) { var p = activo.play(); if (p && p.catch) p.catch(function () {}); }
    };
    arrancar();

    // el autoplay falla por motivos que no controlamos (ahorro de batería,
    // pestaña en segundo plano al cargar): se reintenta en cada oportunidad
    a.addEventListener('loadeddata', arrancar, { once: true });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') arrancar();
    });
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, arrancar, { once: true, passive: true });
    });

    // fundido cruzado entre los dos vídeos para que el bucle no dé un salto
    if (!b || sinMovimiento) return;
    var FADE = 1.1, activo = a, espera = b, cambiando = false;
    function cruzar() {
      cambiando = true;
      espera.currentTime = 0;
      var p = espera.play(); if (p && p.catch) p.catch(function () {});
      espera.style.opacity = '1';
      activo.style.opacity = '0';
      var saliente = activo;
      activo = espera; espera = saliente;
      setTimeout(function () {
        try { saliente.pause(); } catch (e) {}
        cambiando = false;
      }, FADE * 1000);
    }
    [a, b].forEach(function (v) {
      v.addEventListener('timeupdate', function () {
        if (cambiando || v !== activo || !v.duration) return;
        if (v.duration - v.currentTime <= FADE) cruzar();
      });
    });
  })();

  /* ══════════════════ 4. CARRUSEL DE SERVICIOS ══════════════════ */

  (function carrusel() {
    var rail = ref('rail') || $('[data-rail]');
    if (!rail || !rail.children.length) return;
    var barra = ref('progressBar');
    var pausado = false, temporizador = null, visible = false;

    function pasoActual() {
      var cs = getComputedStyle(rail);
      var hueco = parseFloat(cs.columnGap || cs.gap) || 0;
      return rail.children[0].getBoundingClientRect().width + hueco;
    }

    function mover(dir, esUsuario) {
      var paso = pasoActual();
      var max = Math.max(0, rail.scrollWidth - rail.clientWidth);
      var aqui = rail.scrollLeft;
      var encajado = Math.round(aqui / paso) * paso;
      var destino;
      if (dir > 0) destino = (aqui >= max - 2) ? 0 : Math.min(max, encajado + paso);
      else destino = (aqui <= 2) ? max : Math.max(0, encajado - paso);
      rail.scrollTo({ left: destino, behavior: 'smooth' });
      if (esUsuario) pausar();
    }

    function pausar() {
      pausado = true;
      clearTimeout(pausar._t);
      pausar._t = setTimeout(function () { pausado = false; }, 6000);
    }

    $$('[data-action="prev"]').forEach(function (b) {
      b.addEventListener('click', function () { mover(-1, true); });
    });
    $$('[data-action="next"]').forEach(function (b) {
      b.addEventListener('click', function () { mover(1, true); });
    });

    function actualizarBarra() {
      if (!barra) return;
      var max = Math.max(1, rail.scrollWidth - rail.clientWidth);
      var n = rail.children.length;
      barra.style.transform = 'translateX(' + ((rail.scrollLeft / max) * (n - 1) * 100) + '%)';
    }
    if (barra) barra.style.width = (100 / Math.max(1, rail.children.length)) + '%';
    var pendiente = false;
    rail.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () { pendiente = false; actualizarBarra(); });
    }, { passive: true });
    actualizarBarra();

    // arrastre con ratón. En táctil manda el scroll nativo del navegador:
    // si lo duplicamos aquí, los dos se pelean y el gesto va a tirones.
    var arrastrando = false, x0 = 0, left0 = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      arrastrando = true; x0 = e.clientX; left0 = rail.scrollLeft;
      rail.style.cursor = 'grabbing';
    });
    window.addEventListener('pointerup', function () {
      arrastrando = false; rail.style.cursor = 'grab';
    });
    rail.addEventListener('pointermove', function (e) {
      if (!arrastrando) return;
      rail.scrollLeft = left0 - (e.clientX - x0);
    });

    // avance automático
    var seg = CFG.carruselSegundos;
    if (!seg || sinMovimiento) return;
    ['pointerdown', 'wheel', 'touchstart', 'mouseenter'].forEach(function (ev) {
      rail.addEventListener(ev, pausar, { passive: true });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) { visible = e.isIntersecting; });
      }, { threshold: 0.25 }).observe(rail);
    } else { visible = true; }
    temporizador = setInterval(function () {
      if (pausado || !visible) return;
      if (document.visibilityState !== 'visible') return;
      mover(1, false);
    }, seg * 1000);
  })();

  /* ══════════════════ 5. POPUP PROMOCIONAL ══════════════════ */

  (function popup() {
    var capa = $('[data-promo]');
    if (!capa) return;
    var seg = CFG.popupSegundos;

    function cerrar() { capa.hidden = true; }
    $$('[data-action="closePromo"]').forEach(function (b) {
      b.addEventListener('click', cerrar);
    });
    capa.addEventListener('click', function (e) { if (e.target === capa) cerrar(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !capa.hidden) cerrar();
    });

    if (!seg) return;
    setTimeout(function () { capa.hidden = false; }, seg * 1000);
  })();

  /* ══════════════════ 6. MOVIMIENTO AL HACER SCROLL ══════════════════ */

  (function movimiento() {
    if (sinMovimiento) return;

    // barra fina de progreso de lectura
    var barra = document.createElement('div');
    barra.className = 'aws-scroll-progress';
    document.body.appendChild(barra);

    var hero = ref('hero');
    if (hero) hero.style.willChange = 'transform';

    var pendiente = false;
    window.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () {
        pendiente = false;
        var h = document.documentElement;
        barra.style.transform = 'scaleX(' + (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) + ')';
        if (hero) hero.style.transform = 'scale(1.08) translateY(' + Math.min(window.scrollY, 800) * 0.08 + 'px)';
      });
    }, { passive: true });

    if (!('IntersectionObserver' in window)) return;

    // aparición de bloques. Se excluye el contenido del carril: ahí el
    // movimiento lo lleva el propio scroll horizontal.
    var bloques = $$('section > h2, section > p, section > div, section article')
      .filter(function (el) { return !el.closest('[data-rail]') && el.getAttribute('data-reveal') !== 'off'; });
    bloques.forEach(function (el) { el.classList.add('aws-reveal'); });
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e, i) {
        if (!e.isIntersecting) return;
        setTimeout(function () { e.target.classList.add('is-in'); }, Math.min(i * 80, 320));
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    bloques.forEach(function (el) { io.observe(el); });

    // contador del precio
    var precio = ref('price');
    if (!precio) return;
    var destino = CFG.precioFinal || 3700;
    var pio = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t0 = null;
        function paso(t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / 1300);
          var suave = 1 - Math.pow(1 - k, 3);
          precio.textContent = '$' + Math.round(destino * suave).toLocaleString('en-US');
          if (k < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
        pio.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    pio.observe(precio);
  })();

  /* ══════════════════ 7. ARRANQUE ══════════════════ */

  var guardado = null;
  try { guardado = localStorage.getItem('aws-lang'); } catch (e) {}
  aplicarIdioma(guardado && C[guardado] ? guardado : idioma);
})();
