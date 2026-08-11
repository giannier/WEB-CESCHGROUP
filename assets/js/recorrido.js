/* ============================================================
   RECORRIDO INMERSIVO — etapas con scroll, hotspots, comparador
   y visor de galería.

   Todo lo de acá es opcional. Si la obra no declara `recorrido`
   ni `antesDespues`, no se dibuja nada: ni una sección vacía ni
   un título huérfano. Si GSAP no cargó, se cae al modo estático,
   que muestra exactamente la misma información sin movimiento.
   ============================================================ */

(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hayGsap = typeof window.gsap !== 'undefined';
  var hayScrollTrigger = hayGsap && typeof window.ScrollTrigger !== 'undefined';
  var hayFlip = hayGsap && typeof window.Flip !== 'undefined';

  /* Con movimiento reducido o sin GSAP, el recorrido se dibuja
     estático. No es una versión degradada: es la misma información
     completa, legible sin scroll. */
  var animado = hayScrollTrigger && !sinMovimiento;

  function esc(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function param(nombre) {
    return new URLSearchParams(window.location.search).get(nombre);
  }

  function obraActual() {
    if (typeof OBRAS === 'undefined') return null;
    var id = param('id');
    for (var i = 0; i < OBRAS.length; i++) {
      if (OBRAS[i].id === id) return OBRAS[i];
    }
    return null;
  }

  /* Marco rotulado que ocupa el lugar de la foto mientras no exista
     el archivo. La imagen entra recién cuando el navegador confirma
     que cargó, igual que en el resto del sitio. */
  function marco(rotulo) {
    return '<div class="marco-vacio">' + esc(rotulo || 'Registro fotográfico') + '</div>';
  }

  function cargarFoto(contenedor, ruta, alt) {
    if (!ruta) return;
    var prueba = new Image();
    prueba.onload = function () {
      var hueco = $('.marco-vacio', contenedor);
      if (!hueco) return;
      var img = document.createElement('img');
      img.src = ruta;
      img.alt = alt || '';
      img.loading = 'lazy';
      hueco.replaceWith(img);
    };
    prueba.src = ruta;
  }


  /* ==========================================================
     1. HOTSPOTS
     ========================================================== */

  /* Los hotspots viven DENTRO de .etapa-foto a propósito: heredan
     el paneo y el zoom, así que quedan clavados a su punto de la
     foto sin recalcular nada. Al acercarse crecen, lo que agranda
     el área táctil en vez de encogerla. */
  function hotspotsHtml(lista) {
    if (!lista || !lista.length) return '';
    return '<div class="hotspots">' + lista.map(function (h) {
      var alDerecho = h.x > 0.68;
      return '<button type="button" class="hotspot' + (alDerecho ? ' hotspot--izquierda' : '') + '"' +
             ' style="left:' + (h.x * 100) + '%;top:' + (h.y * 100) + '%"' +
             ' aria-expanded="false">' +
               '<span class="hotspot-punto" aria-hidden="true"></span>' +
               '<span class="hotspot-rotulo">' + esc(h.rotulo) + '</span>' +
             '</button>';
    }).join('') + '</div>';
  }

  function activarHotspots(contexto) {
    $$('.hotspot', contexto).forEach(function (boton) {
      boton.addEventListener('click', function () {
        var abierto = boton.getAttribute('aria-expanded') === 'true';
        boton.setAttribute('aria-expanded', String(!abierto));
      });
      // El rótulo es el nombre accesible del botón; el punto es decorativo.
      var rotulo = $('.hotspot-rotulo', boton);
      if (rotulo) boton.setAttribute('aria-label', rotulo.textContent);
    });
  }


  /* ==========================================================
     2. RECORRIDO — MODO ANIMADO
     ========================================================== */

  function pintarAnimado(seccion, etapas, obra) {
    seccion.innerHTML = '' +
      '<div class="recorrido-escena">' +
        '<div class="recorrido-marco">' +
          etapas.map(function (e) {
            return '<figure class="etapa">' +
                     '<div class="etapa-foto">' + marco(e.titulo) + hotspotsHtml(e.hotspots) + '</div>' +
                   '</figure>';
          }).join('') +
        '</div>' +
        '<div class="recorrido-panel"><div class="contenedor"><div class="recorrido-info">' +
          etapas.map(function (e, i) {
            return '<article class="etapa-info">' +
                     '<p class="etapa-num">Etapa ' + ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + etapas.length).slice(-2) + '</p>' +
                     '<h3 class="etapa-titulo">' + esc(e.titulo) + '</h3>' +
                     '<p class="etapa-texto">' + esc(e.texto) + '</p>' +
                   '</article>';
          }).join('') +
        '</div></div></div>' +
        '<p class="recorrido-pista">Scroll</p>' +
        '<div class="recorrido-progreso"><span></span></div>' +
      '</div>';

    var figuras = $$('.etapa', seccion);
    var infos   = $$('.etapa-info', seccion);
    var fotos   = $$('.etapa-foto', seccion);
    var barra   = $('.recorrido-progreso span', seccion);
    var pista   = $('.recorrido-pista', seccion);

    etapas.forEach(function (e, i) {
      cargarFoto(fotos[i], e.foto, obra.nombre + ' — ' + e.titulo);
    });
    activarHotspots(seccion);

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: seccion,
        start: 'top top',
        end: '+=' + (etapas.length * 90) + '%',
        scrub: 1,
        pin: $('.recorrido-escena', seccion),
        anticipatePin: 1,
        onUpdate: function (self) {
          if (barra) barra.style.transform = 'scaleX(' + self.progress + ')';
          if (pista) pista.style.opacity = self.progress > 0.04 ? 0 : 1;
        }
      }
    });

    etapas.forEach(function (etapa, i) {
      var foco = etapa.foco || { x: 0.5, y: 0.5, zoom: 1.2 };
      var zoom = foco.zoom || 1.2;
      // Con transform-origin al centro, para llevar el punto (x,y)
      // al centro después de escalar hay que desplazar (0.5 - x) * zoom.
      var destinoX = (0.5 - foco.x) * 100 * zoom;
      var destinoY = (0.5 - foco.y) * 100 * zoom;
      var etiqueta = 'etapa' + i;

      tl.addLabel(etiqueta);

      if (i > 0) {
        tl.to(figuras[i],  { opacity: 1, duration: 0.4 }, etiqueta)
          .to(figuras[i - 1], { opacity: 0, duration: 0.4 }, etiqueta)
          .to(infos[i],  { opacity: 1, y: 0, duration: 0.35 }, etiqueta)
          .to(infos[i - 1], { opacity: 0, y: -12, duration: 0.35 }, etiqueta);
      }

      // Paneo y zoom hacia el punto de interés, atado al scroll.
      tl.fromTo(fotos[i],
        { xPercent: 0, yPercent: 0, scale: 1.04 },
        { xPercent: destinoX, yPercent: destinoY, scale: zoom, duration: 1.6, ease: 'none' },
        etiqueta);

      var puntos = $$('.hotspot', figuras[i]);
      if (puntos.length) {
        tl.to(puntos, { opacity: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.4)' },
              etiqueta + '+=0.35');
      }
    });

    // El pin necesita alturas definitivas: las fotos e íconos llegan tarde.
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }


  /* ==========================================================
     3. RECORRIDO — MODO ESTÁTICO
     ========================================================== */

  function pintarEstatico(seccion, etapas, obra) {
    seccion.classList.add('recorrido--estatico');
    seccion.innerHTML = '<div class="contenedor">' +
      '<div class="cabecera-seccion">' +
        '<p class="eyebrow">Recorrido de obra</p>' +
        '<h2>Cómo se construyó</h2>' +
      '</div>' +
      etapas.map(function (e, i) {
        return '<figure class="etapa">' +
                 '<p class="etapa-num">Etapa ' + ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + etapas.length).slice(-2) + '</p>' +
                 '<h3 class="etapa-titulo">' + esc(e.titulo) + '</h3>' +
                 '<div class="etapa-foto">' + marco(e.titulo) + '</div>' +
                 '<figcaption class="etapa-texto">' + esc(e.texto) + '</figcaption>' +
                 hotspotsHtml(e.hotspots) +
               '</figure>';
      }).join('') +
    '</div>';

    var fotos = $$('.etapa-foto', seccion);
    etapas.forEach(function (e, i) {
      cargarFoto(fotos[i], e.foto, obra.nombre + ' — ' + e.titulo);
    });
    activarHotspots(seccion);
  }


  /* ==========================================================
     4. COMPARADOR ANTES / DESPUÉS
     ========================================================== */

  function pintarComparador(destino, datos, obra) {
    // Sin las dos imágenes el comparador no tiene sentido: se cae a
    // la que exista, como figura suelta.
    var cargadas = 0, falladas = 0;
    var prueba = {};

    ['antes', 'despues'].forEach(function (clave) {
      var img = new Image();
      img.onload  = function () { prueba[clave] = true;  resolver(); };
      img.onerror = function () { prueba[clave] = false; resolver(); };
      img.src = datos[clave];
    });

    function resolver() {
      cargadas = (prueba.antes ? 1 : 0) + (prueba.despues ? 1 : 0);
      falladas = Object.keys(prueba).length;
      if (falladas < 2) return;

      if (cargadas < 2) {
        var unica = prueba.antes ? datos.antes : (prueba.despues ? datos.despues : null);
        if (!unica) return;
        destino.innerHTML = '<figure style="margin:0"><img src="' + esc(unica) + '" alt="' +
                            esc(obra.nombre) + '" loading="lazy" style="width:100%;border-radius:var(--radio)"></figure>';
        destino.hidden = false;
        return;
      }

      destino.innerHTML = '' +
        '<p class="eyebrow">Antes y después</p>' +
        '<h2>El mismo punto, dos momentos</h2>' +
        '<div class="comparador" data-comparador>' +
          '<img class="comparador-antes" src="' + esc(datos.antes) + '" alt="' + esc(obra.nombre) + ' antes de la intervención">' +
          '<img class="comparador-despues" src="' + esc(datos.despues) + '" alt="' + esc(obra.nombre) + ' después de la intervención">' +
          '<span class="comparador-rotulo comparador-rotulo--antes">' + esc(datos.rotuloAntes || 'Antes') + '</span>' +
          '<span class="comparador-rotulo comparador-rotulo--despues">' + esc(datos.rotuloDespues || 'Después') + '</span>' +
          '<button type="button" class="comparador-tirador" role="slider" aria-label="Comparar antes y después"' +
                 ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></button>' +
        '</div>';
      destino.hidden = false;
      activarComparador($('[data-comparador]', destino));
    }
  }

  function activarComparador(caja) {
    if (!caja) return;
    var despues  = $('.comparador-despues', caja);
    var tirador  = $('.comparador-tirador', caja);
    var arrastra = false;

    function poner(pct) {
      pct = Math.max(0, Math.min(100, pct));
      despues.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      tirador.style.left = pct + '%';
      tirador.setAttribute('aria-valuenow', Math.round(pct));
    }

    function desdeEvento(e) {
      var r = caja.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      poner((x / r.width) * 100);
    }

    caja.addEventListener('mousedown', function (e) { arrastra = true; desdeEvento(e); });
    window.addEventListener('mousemove', function (e) { if (arrastra) desdeEvento(e); });
    window.addEventListener('mouseup', function () { arrastra = false; });

    caja.addEventListener('touchstart', function (e) { arrastra = true; desdeEvento(e); }, { passive: true });
    caja.addEventListener('touchmove', function (e) { if (arrastra) desdeEvento(e); }, { passive: true });
    caja.addEventListener('touchend', function () { arrastra = false; });

    tirador.addEventListener('keydown', function (e) {
      var actual = Number(tirador.getAttribute('aria-valuenow'));
      var paso = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft')  { poner(actual - paso); e.preventDefault(); }
      if (e.key === 'ArrowRight') { poner(actual + paso); e.preventDefault(); }
      if (e.key === 'Home')       { poner(0);   e.preventDefault(); }
      if (e.key === 'End')        { poner(100); e.preventDefault(); }
    });

    poner(50);
  }


  /* ==========================================================
     5. VISOR DE GALERÍA
     ========================================================== */

  function montarVisor() {
    var figuras = $$('.galeria figure');
    if (!figuras.length) return;

    var visor = document.createElement('div');
    visor.className = 'visor';
    visor.setAttribute('role', 'dialog');
    visor.setAttribute('aria-modal', 'true');
    visor.setAttribute('aria-label', 'Imagen ampliada');
    visor.innerHTML = '<button type="button" class="visor-cerrar" aria-label="Cerrar imagen">✕</button>' +
                      '<div class="visor-cuerpo"></div>' +
                      '<p class="visor-pie"></p>';
    document.body.appendChild(visor);

    var cuerpo  = $('.visor-cuerpo', visor);
    var pie     = $('.visor-pie', visor);
    var cerrar  = $('.visor-cerrar', visor);
    var origen  = null;   // figura desde la que se abrió
    var medio   = null;   // nodo movido al visor
    var hueco   = null;   // reserva del espacio en la grilla
    var disparador = null;

    figuras.forEach(function (figura) {
      figura.setAttribute('tabindex', '0');
      figura.setAttribute('role', 'button');
      var pieFig = $('figcaption', figura);
      figura.setAttribute('aria-label', 'Ampliar: ' + (pieFig ? pieFig.textContent : 'imagen'));
      figura.addEventListener('click', function () { abrir(figura); });
      figura.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(figura); }
      });
    });

    function abrir(figura) {
      if (medio) return;
      origen = figura;
      disparador = figura;
      medio = $('img, .marco-vacio', figura);
      if (!medio) return;

      var pieFig = $('figcaption', figura);
      pie.textContent = pieFig ? pieFig.textContent : '';

      // Se reserva el hueco para que la grilla no colapse al mover el nodo.
      var caja = medio.getBoundingClientRect();
      hueco = document.createElement('div');
      hueco.style.width = caja.width + 'px';
      hueco.style.height = caja.height + 'px';
      figura.insertBefore(hueco, medio);

      if (hayFlip && !sinMovimiento) {
        var estado = Flip.getState(medio);
        cuerpo.appendChild(medio);
        visor.classList.add('abierto');
        Flip.from(estado, { duration: 0.6, ease: 'expo.inOut', absolute: true, scale: true });
      } else {
        cuerpo.appendChild(medio);
        visor.classList.add('abierto');
      }

      cerrar.focus();
      document.body.style.overflow = 'hidden';
    }

    function cerrarVisor() {
      if (!medio) return;

      if (hayFlip && !sinMovimiento) {
        var estado = Flip.getState(medio);
        hueco.replaceWith(medio);
        visor.classList.remove('abierto');
        Flip.from(estado, { duration: 0.45, ease: 'expo.inOut', absolute: true, scale: true });
      } else {
        hueco.replaceWith(medio);
        visor.classList.remove('abierto');
      }

      medio = null; hueco = null; origen = null;
      document.body.style.overflow = '';
      if (disparador) disparador.focus();
    }

    cerrar.addEventListener('click', cerrarVisor);
    visor.addEventListener('click', function (e) { if (e.target === visor) cerrarVisor(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && medio) cerrarVisor();
      // Con el visor abierto el foco no sale de él.
      if (e.key === 'Tab' && medio) { e.preventDefault(); cerrar.focus(); }
    });
  }


  /* ==========================================================
     ARRANQUE
     ========================================================== */

  function iniciar() {
    var obra = obraActual();
    if (!obra) { montarVisor(); return; }

    var seccion = $('#recorrido');
    if (seccion && obra.recorrido && obra.recorrido.length) {
      seccion.hidden = false;
      if (animado) pintarAnimado(seccion, obra.recorrido, obra);
      else         pintarEstatico(seccion, obra.recorrido, obra);
    }

    var comparador = $('#comparador-obra');
    if (comparador && obra.antesDespues && obra.antesDespues.antes && obra.antesDespues.despues) {
      pintarComparador(comparador, obra.antesDespues, obra);
    }

    montarVisor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
