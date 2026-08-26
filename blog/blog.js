/* Aqua Well Spring · páginas de artículo
   Selector de idioma. Cada idioma es un bloque completo en el HTML
   (data-pane="es|en"); esto solo cambia cuál se muestra y traduce las
   etiquetas sueltas del header y el footer marcadas con data-t.
   Recuerda la elección del visitante y respeta la de la landing. */

(function () {
  'use strict';

  var ETIQUETAS = {
    es: {
      navHome: 'Inicio', navBenefits: 'Beneficios', navServices: 'Servicios', navGallery: 'Servicios',
      navBlog: 'Blog', navContact: 'Contacto', ctaFreeTest: 'Análisis Gratis',
      offerTag: 'Oferta', offerPrice: '$3,700 instalado', offerOld: 'antes $7,500',
      offerMonthly: 'desde $63/mes',
      copyright: '© 2026 Aqua Well Spring. Houston, TX. Todos los derechos reservados.'
    },
    en: {
      navHome: 'Home', navBenefits: 'Benefits', navServices: 'Services', navGallery: 'Services',
      navBlog: 'Blog', navContact: 'Contact', ctaFreeTest: 'Free Water Test',
      offerTag: 'Offer', offerPrice: '$3,700 installed', offerOld: 'was $7,500',
      offerMonthly: 'from $63/mo',
      copyright: '© 2026 Aqua Well Spring. Houston, TX. All rights reserved.'
    }
  };

  var todos = function (sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  };

  function aplicar(cod) {
    if (!ETIQUETAS[cod]) return;
    todos('[data-pane]').forEach(function (p) {
      p.classList.toggle('is-on', p.getAttribute('data-pane') === cod);
    });
    todos('.bl-pill').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-lang') === cod);
    });
    todos('[data-t]').forEach(function (el) {
      var v = ETIQUETAS[cod][el.getAttribute('data-t')];
      if (v) el.textContent = v;
    });
    document.documentElement.setAttribute('lang', cod);
    try { localStorage.setItem('aws-lang', cod); } catch (e) {}
  }

  todos('.bl-pill').forEach(function (b) {
    b.addEventListener('click', function () { aplicar(b.getAttribute('data-lang')); });
  });

  // misma clave que usa la landing, así el idioma se mantiene al navegar
  var guardado = null;
  try { guardado = localStorage.getItem('aws-lang'); } catch (e) {}
  aplicar(guardado === 'en' ? 'en' : 'es');
})();
