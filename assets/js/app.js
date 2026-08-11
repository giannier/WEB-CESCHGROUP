/* ============================================================
   APP — arma el sitio a partir de datos.js
   No hay que tocar este archivo para actualizar la empresa ni
   las obras: todo el contenido sale de EMPRESA, OBRAS,
   SERVICIOS y CIFRAS.
   ============================================================ */

(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Escapa texto antes de inyectarlo con innerHTML. */
  function esc(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Lee "redes.facebook" dentro de un objeto. */
  function leerRuta(objeto, ruta) {
    return ruta.split('.').reduce(function (acc, clave) {
      return acc == null ? undefined : acc[clave];
    }, objeto);
  }

  function param(nombre) {
    return new URLSearchParams(window.location.search).get(nombre);
  }

  /* Minúsculas y sin tildes, para que "monsefu" encuentre "Monsefú". */
  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }


  /* ==========================================================
     1. DATOS DE LA EMPRESA EN CABECERA, PIE Y CONTACTO
     ========================================================== */

  function pintarEmpresa() {
    if (typeof EMPRESA === 'undefined') return;

    $$('[data-emp]').forEach(function (nodo) {
      var valor = leerRuta(EMPRESA, nodo.dataset.emp);
      if (valor == null || valor === '') return;

      var prefijo = nodo.dataset.empPrefijo;
      if (prefijo) {
        // tel: y mailto: no admiten espacios ni separadores.
        var destino = prefijo === 'tel:' ? String(valor).replace(/[^\d+]/g, '') : valor;
        nodo.setAttribute('href', prefijo + destino);
      } else if (nodo.tagName === 'A') {
        nodo.setAttribute('href', valor);
      }

      if (nodo.dataset.empTexto !== 'no') nodo.textContent = valor;
    });

    // Inicial provisional mientras no exista el logotipo.
    $$('[data-iso]').forEach(function (nodo) {
      nodo.textContent = (EMPRESA.nombre || 'C').trim().charAt(0).toUpperCase();
    });

    var titulo = document.title;
    if (titulo.indexOf('CONSTRUCTORA XYZ') === 0 && EMPRESA.nombre) {
      document.title = titulo.replace('CONSTRUCTORA XYZ', EMPRESA.nombre);
    }

    var anio = $('#anio');
    if (anio) anio.textContent = new Date().getFullYear();
  }

  /* Todos los enlaces con data-wa abren WhatsApp con el mensaje. */
  function pintarWhatsapp() {
    if (typeof EMPRESA === 'undefined') return;
    var numero = String(EMPRESA.whatsapp || '').replace(/\D/g, '');

    $$('[data-wa]').forEach(function (nodo) {
      nodo.setAttribute('href', enlaceWhatsapp(nodo.dataset.wa));
      nodo.setAttribute('target', '_blank');
      nodo.setAttribute('rel', 'noopener');
    });

    function enlaceWhatsapp(mensaje) {
      if (!numero) return 'https://wa.me/';
      return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensaje || '');
    }
  }


  /* ==========================================================
     2. CABECERA: MENÚ MÓVIL, SOMBRA Y ENLACE ACTIVO
     ========================================================== */

  function cabecera() {
    var boton = $('.hamburguesa');
    var menu  = $('#menu-principal');
    var barra = $('.cabecera');

    if (boton && menu) {
      boton.addEventListener('click', function () {
        var abierto = menu.classList.toggle('abierto');
        boton.setAttribute('aria-expanded', String(abierto));
        boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
        document.body.classList.toggle('menu-abierto', abierto);
      });

      // Al navegar dentro de la misma página el panel debe cerrarse.
      $$('a', menu).forEach(function (enlace) {
        enlace.addEventListener('click', cerrarMenu);
      });

      document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') cerrarMenu();
      });

      document.addEventListener('click', function (evento) {
        if (!menu.classList.contains('abierto')) return;
        if (menu.contains(evento.target) || boton.contains(evento.target)) return;
        cerrarMenu();
      });
    }

    function cerrarMenu() {
      if (!menu || !boton) return;
      menu.classList.remove('abierto');
      boton.setAttribute('aria-expanded', 'false');
      boton.setAttribute('aria-label', 'Abrir menú');
      document.body.classList.remove('menu-abierto');
    }

    if (barra) {
      var alSubir = function () {
        barra.classList.toggle('fijada', window.scrollY > 12);
      };
      alSubir();
      window.addEventListener('scroll', alSubir, { passive: true });
    }

    /* Marca UN solo enlace del menú como actual. "Obras" apunta a
       obras.html y "Proyectos" a obras.html?estado=proyecto: si se
       compara solo el archivo, se encienden los dos. Por eso primero
       se busca la coincidencia exacta con el query. */
    var archivo = window.location.pathname.split('/').pop() || 'index.html';
    var actual = archivo + window.location.search;
    var enlaces = $$('#menu-principal a[href]');

    var exacto = enlaces.filter(function (enlace) {
      return enlace.getAttribute('href').split('#')[0] === actual;
    })[0];

    if (exacto) {
      exacto.classList.add('activo');
      return;
    }

    // Sin coincidencia exacta gana el enlace del archivo que no lleva query.
    var base = enlaces.filter(function (enlace) {
      var href = enlace.getAttribute('href').split('#')[0];
      return href === archivo;
    })[0];

    if (base) base.classList.add('activo');
  }


  /* ==========================================================
     3. APARICIÓN AL HACER SCROLL
     ========================================================== */

  function revelar() {
    var elementos = $$('.revelar');
    if (!elementos.length) return;

    if (sinMovimiento || !('IntersectionObserver' in window)) {
      elementos.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px' });

    elementos.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 90 + 'ms';
      observador.observe(el);
    });
  }


  /* ==========================================================
     4. PIEZAS REUTILIZABLES DE OBRA
     ========================================================== */

  function estadoDe(obra) {
    return (typeof ESTADOS !== 'undefined' && ESTADOS[obra.estado]) ||
           { texto: obra.estado, clase: 'proyecto' };
  }

  function etiquetaEstado(obra) {
    var estado = estadoDe(obra);
    return '<span class="estado estado--' + esc(estado.clase) + '">' + esc(estado.texto) + '</span>';
  }

  /* Se pinta siempre el marco rotulado. La foto entra después, y solo
     si el archivo existe: así la tarjeta nunca se ve rota. */
  function medioObra(obra, rotulo) {
    return '<div class="marco-vacio"' +
           (obra.foto ? ' data-foto="' + esc(obra.foto) + '" data-alt="' + esc(obra.nombre) + '"' : '') +
           '>' + esc(rotulo || 'Registro fotográfico') + '</div>';
  }

  function cargarFotos(contexto) {
    $$('.marco-vacio[data-foto]', contexto).forEach(function (marco) {
      var ruta = marco.dataset.foto;
      var prueba = new Image();
      prueba.onload = function () {
        var img = document.createElement('img');
        img.src = ruta;
        img.alt = marco.dataset.alt || '';
        img.loading = 'lazy';
        marco.replaceWith(img);
      };
      prueba.src = ruta;
    });
  }

  function barraAvance(obra) {
    if (obra.estado !== 'ejecucion') return '';
    var avance = Number(obra.avance) || 0;
    return '' +
      '<div class="avance">' +
        '<div class="avance-dato"><span>Avance físico</span><span>' + avance + ' %</span></div>' +
        '<div class="avance-barra"><div class="avance-relleno" data-avance="' + avance + '"></div></div>' +
      '</div>';
  }

  function tarjetaObra(obra) {
    return '' +
      '<article class="ficha revelar" data-id="' + esc(obra.id) + '">' +
        '<div class="ficha-media">' + etiquetaEstado(obra) + medioObra(obra) + '</div>' +
        '<div class="ficha-cuerpo">' +
          '<p class="ficha-codigo">' + esc(obra.codigo) + ' · ' + esc(obra.tipo) + '</p>' +
          '<h3>' + esc(obra.nombre) + '</h3>' +
          '<p class="ficha-ubicacion">' + esc(obra.ubicacion) + '</p>' +
          barraAvance(obra) +
          '<div class="ficha-pie"><span>' + esc(obra.servicio) + '</span><strong>' + esc(obra.monto) + '</strong></div>' +
        '</div>' +
      '</article>';
  }

  /* Las tarjetas son clicables completas, no solo el título. */
  function activarTarjetas(contenedor) {
    $$('.ficha[data-id]', contenedor).forEach(function (ficha) {
      ficha.addEventListener('click', function () {
        window.location.href = 'obra.html?id=' + encodeURIComponent(ficha.dataset.id);
      });
    });
    animarAvances(contenedor);
    cargarFotos(contenedor);
  }

  function animarAvances(contexto) {
    $$('.avance-relleno', contexto).forEach(function (relleno) {
      var destino = relleno.dataset.avance + '%';
      if (sinMovimiento) { relleno.style.width = destino; return; }
      requestAnimationFrame(function () {
        setTimeout(function () { relleno.style.width = destino; }, 150);
      });
    });
  }


  /* ==========================================================
     5. HERO DE LA PORTADA
     ========================================================== */

  function hero() {
    var cuerpo = $('#hero-cuerpo');
    if (!cuerpo || typeof OBRAS === 'undefined') return;

    var capa = $('#hero-capa');
    var destacadas = OBRAS.filter(function (o) { return o.destacada; });
    if (!destacadas.length) destacadas = OBRAS.slice(0, 3);
    if (!destacadas.length) return;

    var indice = 0;
    var temporizador = null;

    var controles = $('.hero-controles');
    var puntos = document.createElement('div');
    puntos.className = 'hero-puntos';
    destacadas.forEach(function (obra, i) {
      var punto = document.createElement('button');
      punto.type = 'button';
      punto.setAttribute('aria-label', 'Ver obra ' + (i + 1) + ' de ' + destacadas.length);
      punto.addEventListener('click', function () { ir(i); });
      puntos.appendChild(punto);
    });
    if (controles) controles.appendChild(puntos);

    function pintar() {
      var obra = destacadas[indice];
      var enlace = 'obra.html?id=' + encodeURIComponent(obra.id);

      cuerpo.innerHTML = '' +
        etiquetaEstado(obra) +
        '<h1 class="hero-titulo"><a href="' + enlace + '">' + esc(obra.nombre) + '</a></h1>' +
        '<div class="hero-meta">' +
          '<span>' + esc(obra.ubicacion) + '</span>' +
          '<span>' + esc(obra.cliente) + '</span>' +
          '<span>' + esc(obra.monto) + '</span>' +
        '</div>' +
        (obra.estado === 'ejecucion'
          ? '<div style="max-width:320px;margin-bottom:var(--e3)">' + barraAvance(obra) + '</div>'
          : '') +
        '<div class="hero-acciones">' +
          '<a class="boton boton--acento" href="' + enlace + '">Ver ficha de la obra</a>' +
          '<a class="boton boton--claro" href="obras.html">Portafolio completo</a>' +
        '</div>';

      animarAvances(cuerpo);

      $$('button', puntos).forEach(function (punto, i) {
        punto.setAttribute('aria-current', String(i === indice));
      });

      // La foto solo se aplica si el archivo realmente existe.
      if (capa && obra.foto) {
        var prueba = new Image();
        prueba.onload = function () {
          capa.style.backgroundImage = 'url("' + obra.foto + '")';
          capa.classList.add('cargada');
        };
        prueba.onerror = function () {
          capa.style.backgroundImage = '';
          capa.classList.remove('cargada');
        };
        prueba.src = obra.foto;
      } else if (capa) {
        capa.style.backgroundImage = '';
        capa.classList.remove('cargada');
      }
    }

    function ir(destino) {
      indice = (destino + destacadas.length) % destacadas.length;
      pintar();
      reiniciar();
    }

    function reiniciar() {
      if (temporizador) clearInterval(temporizador);
      if (sinMovimiento || destacadas.length < 2) return;
      temporizador = setInterval(function () { ir(indice + 1); }, 7000);
    }

    var anterior = $('#hero-anterior');
    var siguiente = $('#hero-siguiente');
    if (anterior)  anterior.addEventListener('click',  function () { ir(indice - 1); });
    if (siguiente) siguiente.addEventListener('click', function () { ir(indice + 1); });

    // Pausa mientras la pestaña está oculta para no gastar batería.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (temporizador) clearInterval(temporizador); }
      else reiniciar();
    });

    pintar();
    reiniciar();
  }


  /* ==========================================================
     6. CIFRAS CON CONTEO
     ========================================================== */

  function cifras() {
    var contenedor = $('#cifras');
    if (!contenedor || typeof CIFRAS === 'undefined') return;

    contenedor.innerHTML = CIFRAS.map(function (cifra) {
      return '' +
        '<div class="cifra revelar">' +
          '<p class="cifra-valor" data-valor="' + Number(cifra.valor) + '" ' +
             'data-sufijo="' + esc(cifra.sufijo || '') + '">0' + esc(cifra.sufijo || '') + '</p>' +
          '<p class="cifra-rotulo">' + esc(cifra.rotulo) + '</p>' +
        '</div>';
    }).join('');

    var valores = $$('.cifra-valor', contenedor);

    if (sinMovimiento || !('IntersectionObserver' in window)) {
      valores.forEach(function (nodo) {
        nodo.textContent = nodo.dataset.valor + nodo.dataset.sufijo;
      });
      return;
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        contar(entrada.target);
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.4 });

    valores.forEach(function (nodo) { observador.observe(nodo); });

    function contar(nodo) {
      var destino = Number(nodo.dataset.valor) || 0;
      var sufijo = nodo.dataset.sufijo || '';
      var inicio = null;
      var duracion = 1400;

      function paso(marca) {
        if (inicio === null) inicio = marca;
        var avance = Math.min((marca - inicio) / duracion, 1);
        var suavizado = 1 - Math.pow(1 - avance, 3);
        nodo.textContent = Math.round(destino * suavizado) + sufijo;
        if (avance < 1) requestAnimationFrame(paso);
      }
      requestAnimationFrame(paso);
    }
  }


  /* ==========================================================
     7. SERVICIOS
     ========================================================== */

  var ICONOS = {
    grua: '<path d="M4 44h40M8 44V10l28 8M8 18l28 8M36 18v10M36 18l6-6M20 26v10h8"/>',
    casco: '<path d="M6 34a18 18 0 0 1 36 0M14 34V20a10 10 0 0 1 20 0v14M4 34h40v6H4z"/>',
    plano: '<path d="M6 10h36v28H6zM6 20h36M16 10v28M26 20v18M34 26h8"/>',
    carpeta: '<path d="M6 12h14l4 6h18v22H6zM6 24h36M16 32h16"/>'
  };

  function servicios() {
    var contenedor = $('#servicios');
    if (!contenedor || typeof SERVICIOS === 'undefined') return;

    contenedor.innerHTML = SERVICIOS.map(function (servicio, i) {
      var trazo = ICONOS[servicio.icono] || ICONOS.carpeta;
      var lista = (servicio.items || []).map(function (item) {
        return '<li>' + esc(item) + '</li>';
      }).join('');

      return '' +
        '<article class="servicio revelar" id="' + esc(servicio.icono) + '">' +
          '<span class="servicio-num">' + ('0' + (i + 1)).slice(-2) + '</span>' +
          '<svg class="servicio-icono" viewBox="0 0 48 48" fill="none" stroke="currentColor" ' +
               'stroke-width="2.2" stroke-linecap="square" aria-hidden="true">' + trazo + '</svg>' +
          '<h3>' + esc(servicio.titulo) + '</h3>' +
          '<p>' + esc(servicio.texto) + '</p>' +
          (lista ? '<ul>' + lista + '</ul>' : '') +
        '</article>';
    }).join('');
  }


  /* ==========================================================
     8. OBRAS DESTACADAS EN LA PORTADA
     ========================================================== */

  function obrasDestacadas() {
    var contenedor = $('#obras-destacadas');
    if (!contenedor || typeof OBRAS === 'undefined') return;

    var lista = OBRAS.filter(function (o) { return o.destacada; }).slice(0, 3);
    if (lista.length < 3) lista = OBRAS.slice(0, 3);

    contenedor.innerHTML = lista.map(tarjetaObra).join('');
    activarTarjetas(contenedor);
  }


  /* ==========================================================
     9. PORTAFOLIO CON FILTROS (obras.html)
     ========================================================== */

  function portafolio() {
    var rejilla = $('#rejilla-obras');
    if (!rejilla || typeof OBRAS === 'undefined') return;

    var botones = $$('.filtro');
    var selServicio = $('#filtro-servicio');
    var campoTexto = $('#filtro-texto');

    // Estado inicial tomado de la URL: obras.html?estado=…&servicio=…&q=…
    var filtro = {
      estado: param('estado') || 'todas',
      servicio: param('servicio') || 'todos',
      texto: param('q') || ''
    };

    if (selServicio && filtro.servicio !== 'todos') selServicio.value = filtro.servicio;
    if (campoTexto && filtro.texto) campoTexto.value = filtro.texto;

    var conteo = document.createElement('p');
    conteo.className = 'conteo';
    rejilla.parentNode.insertBefore(conteo, rejilla);

    botones.forEach(function (boton) {
      boton.addEventListener('click', function () {
        filtro.estado = boton.dataset.estado;
        pintar();
      });
    });

    if (selServicio) {
      selServicio.addEventListener('change', function () {
        filtro.servicio = selServicio.value;
        pintar();
      });
    }

    if (campoTexto) {
      var espera = null;
      campoTexto.addEventListener('input', function () {
        clearTimeout(espera);
        espera = setTimeout(function () {
          filtro.texto = campoTexto.value;
          pintar();
        }, 180);
      });
    }

    function coincide(obra) {
      if (filtro.estado !== 'todas' && obra.estado !== filtro.estado) return false;
      if (filtro.servicio !== 'todos' && obra.servicio !== filtro.servicio) return false;
      if (!filtro.texto.trim()) return true;

      var aguja = normalizar(filtro.texto.trim());
      var pajar = normalizar([
        obra.nombre, obra.ubicacion, obra.cliente,
        obra.tipo, obra.codigo, obra.servicio, obra.resumen
      ].join(' '));
      return pajar.indexOf(aguja) !== -1;
    }

    function pintar() {
      botones.forEach(function (boton) {
        boton.setAttribute('aria-pressed', String(boton.dataset.estado === filtro.estado));
      });

      var resultado = OBRAS.filter(coincide);

      if (!resultado.length) {
        conteo.textContent = '';
        rejilla.innerHTML =
          '<p class="sin-resultados">Ninguna obra coincide con los filtros aplicados. ' +
          'Pruebe con otro estado o borre el texto de búsqueda.</p>';
        return;
      }

      conteo.textContent = resultado.length +
        (resultado.length === 1 ? ' obra encontrada' : ' obras encontradas');
      rejilla.innerHTML = resultado.map(tarjetaObra).join('');
      $$('.ficha', rejilla).forEach(function (f) { f.classList.add('visible'); });
      activarTarjetas(rejilla);
    }

    pintar();
  }


  /* ==========================================================
     10. FICHA DE OBRA (obra.html)
     ========================================================== */

  function fichaObra() {
    var portada = $('#portada-obra');
    if (!portada || typeof OBRAS === 'undefined') return;

    var id = param('id');
    var obra = OBRAS.filter(function (o) { return o.id === id; })[0];

    // Sin id válido no se inventa contenido: se devuelve al portafolio.
    if (!obra) {
      portada.classList.add('plano-oscuro');
      portada.innerHTML =
        '<div class="contenedor">' +
          '<p class="migas"><a href="index.html">Inicio</a> / <a href="obras.html">Obras</a></p>' +
          '<h1>Obra no encontrada</h1>' +
          '<p class="entradilla">El enlace no corresponde a ninguna obra del portafolio.</p>' +
          '<a class="boton boton--acento" href="obras.html" style="margin-top:1.5rem">Ver todas las obras</a>' +
        '</div>';
      var resto = $$('#detalle-obra > section').slice(1);
      resto.forEach(function (seccion) { seccion.remove(); });
      return;
    }

    var razon = (typeof EMPRESA !== 'undefined' && EMPRESA.nombre) || '';
    document.title = obra.nombre + (razon ? ' | ' + razon : '');
    var descripcion = document.querySelector('meta[name="description"]');
    if (descripcion) descripcion.setAttribute('content', obra.resumen);

    /* --- Portada --- */
    portada.innerHTML =
      '<div class="contenedor">' +
        '<p class="migas"><a href="index.html">Inicio</a> / <a href="obras.html">Obras</a> / ' + esc(obra.codigo) + '</p>' +
        etiquetaEstado(obra) +
        '<h1>' + esc(obra.nombre) + '</h1>' +
        '<p class="entradilla">' + esc(obra.resumen) + '</p>' +
      '</div>';

    if (obra.foto) {
      var prueba = new Image();
      prueba.onload = function () {
        portada.style.backgroundImage = 'url("' + obra.foto + '")';
      };
      prueba.src = obra.foto;
    }

    /* --- Hoja técnica --- */
    var hoja = $('#hoja-tecnica');
    if (hoja) {
      var campos = [
        ['Código', obra.codigo, true],
        ['Entidad contratante', obra.cliente, false],
        ['Ubicación', obra.ubicacion, false],
        ['Monto contractual', obra.monto, true],
        ['Plazo de ejecución', obra.plazo, true],
        ['Modalidad', obra.modalidad, false],
        ['Tipo de obra', obra.tipo, false],
        ['Inicio', obra.inicio, true],
        ['Término', obra.fin, true]
      ];
      hoja.innerHTML = campos.map(function (campo) {
        return '<div><p class="rotulo">' + esc(campo[0]) + '</p>' +
               '<p class="valor' + (campo[2] ? ' dato' : '') + '">' + esc(campo[1] || '—') + '</p></div>';
      }).join('');
    }

    /* --- Alcance --- */
    var alcance = $('#alcance');
    if (alcance) {
      alcance.innerHTML = (obra.alcance || []).map(function (item) {
        return '<li>' + esc(item) + '</li>';
      }).join('') || '<li>Alcance pendiente de publicación.</li>';
    }

    /* --- Caja lateral --- */
    var lateral = $('#lateral');
    if (lateral) {
      lateral.innerHTML =
        '<h3>Estado de la obra</h3>' +
        etiquetaEstado(obra) +
        (obra.estado === 'ejecucion' ? '<div style="margin-top:1rem">' + barraAvance(obra) + '</div>' : '') +
        '<dl style="margin-top:1.25rem">' +
          '<div><dt>Servicio</dt><dd>' + esc(obra.servicio) + '</dd></div>' +
          '<div><dt>Entidad</dt><dd>' + esc(obra.cliente) + '</dd></div>' +
          '<div><dt>Ubicación</dt><dd>' + esc(obra.ubicacion) + '</dd></div>' +
          '<div><dt>Modalidad</dt><dd>' + esc(obra.modalidad) + '</dd></div>' +
        '</dl>' +
        '<a class="boton boton--acento" style="width:100%;justify-content:center" ' +
           'data-wa="Hola, quisiera información sobre la obra ' + esc(obra.codigo) + ' — ' + esc(obra.nombre) + '.">' +
           'Consultar por esta obra</a>';
      animarAvances(lateral);
      pintarWhatsapp();
    }

    /* --- Otras obras --- */
    var otras = $('#otras-obras');
    if (otras) {
      var resto = OBRAS.filter(function (o) { return o.id !== obra.id; }).slice(0, 3);
      otras.innerHTML = resto.map(tarjetaObra).join('');
      activarTarjetas(otras);
    }
  }


  /* ==========================================================
     11. FORMULARIOS
     Arman el mensaje y lo abren en WhatsApp. Para conectar a
     correo o CRM se reemplaza window.open por un fetch() al
     endpoint correspondiente.
     ========================================================== */

  function formulario() {
    $$('form.formulario').forEach(function (form) {

      /* Trampa antispam: campo oculto que ninguna persona ve, más la
         marca de tiempo de apertura. El servidor descarta lo que llega
         relleno o demasiado rápido. */
      var trampa = document.createElement('input');
      trampa.type = 'text';
      trampa.name = 'sitio_web';
      trampa.tabIndex = -1;
      trampa.autocomplete = 'off';
      trampa.setAttribute('aria-hidden', 'true');
      trampa.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
      form.appendChild(trampa);

      var abierto = Date.now();
      var boton = form.querySelector('button[type="submit"], .boton');
      var textoBoton = boton ? boton.textContent : '';

      function leerCampos() {
        var datos = {};
        var lineas = [];
        $$('.campo', form).forEach(function (campo) {
          var control = campo.querySelector('input, select, textarea');
          var etiqueta = campo.querySelector('span');
          if (!control || !etiqueta || !control.name) return;
          var valor = String(control.value || '').trim();
          datos[control.name] = valor;
          if (valor) lineas.push(etiqueta.textContent.replace(/\s*\*$/, '') + ': ' + valor);
        });
        return { datos: datos, lineas: lineas };
      }

      function enlaceWhatsapp(lineas) {
        var numero = String((typeof EMPRESA !== 'undefined' && EMPRESA.whatsapp) || '').replace(/\D/g, '');
        var texto = ['*' + (form.dataset.envio || 'Nuevo mensaje desde la web') + '*', ''].concat(lineas).join('\n');
        return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto);
      }

      function avisar(mensaje, esError) {
        var aviso = $('#form-aviso', form) || $('#form-aviso');
        if (!aviso) return;
        aviso.hidden = false;
        aviso.textContent = mensaje;
        aviso.classList.toggle('aviso--error', !!esError);
        if (aviso.scrollIntoView) {
          aviso.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'center' });
        }
      }

      /* Si el correo no sale, el contacto NO se pierde: se ofrece
         WhatsApp con el mensaje ya armado y los datos siguen escritos
         en el formulario. */
      function caerAWhatsapp(lineas, motivo) {
        var enlace = form.querySelector('[data-wa-respaldo]');
        if (!enlace) {
          enlace = document.createElement('a');
          enlace.className = 'boton boton--acento';
          enlace.setAttribute('data-wa-respaldo', '');
          enlace.target = '_blank';
          enlace.rel = 'noopener';
          enlace.style.marginTop = '.75rem';
          form.appendChild(enlace);
        }
        enlace.href = enlaceWhatsapp(lineas);
        enlace.textContent = 'Enviar por WhatsApp';
        avisar(motivo + ' Sus datos siguen cargados: puede enviarlos por WhatsApp con el botón de abajo.', true);
      }

      form.addEventListener('submit', function (evento) {
        evento.preventDefault();
        if (!form.reportValidity()) return;

        var campos = leerCampos();
        var cuerpo = campos.datos;
        cuerpo._t = abierto;
        cuerpo._tipo = form.id === 'form-reclamo' ? 'reclamo' : 'contacto';
        cuerpo.sitio_web = trampa.value;

        if (boton) { boton.disabled = true; boton.textContent = 'Enviando…'; }

        fetch('contacto.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cuerpo)
        })
          .then(function (r) {
            return r.json().then(function (j) { return { ok: r.ok, cuerpo: j }; });
          })
          .then(function (res) {
            if (res.ok && res.cuerpo && res.cuerpo.ok) {
              form.reset();
              abierto = Date.now();
              var respaldo = form.querySelector('[data-wa-respaldo]');
              if (respaldo) respaldo.remove();
              avisar(form.id === 'form-reclamo'
                ? 'Su reclamo fue registrado. Recibirá respuesta en un plazo máximo de quince (15) días hábiles.'
                : 'Mensaje enviado. Le respondemos en un plazo máximo de 48 horas hábiles.', false);
              return;
            }
            if (res.cuerpo && res.cuerpo.errores) {
              avisar('Revise los campos marcados e intente de nuevo.', true);
              return;
            }
            caerAWhatsapp(campos.lineas, 'No pudimos enviar el correo desde el servidor.');
          })
          .catch(function () {
            caerAWhatsapp(campos.lineas, 'No hay conexión con el servidor.');
          })
          .then(function () {
            if (boton) { boton.disabled = false; boton.textContent = textoBoton; }
          });
      });
    });
  }


  /* ==========================================================
     ARRANQUE
     ========================================================== */

  function iniciar() {
    pintarEmpresa();
    pintarWhatsapp();
    cabecera();
    hero();
    cifras();
    servicios();
    obrasDestacadas();
    portafolio();
    fichaObra();
    formulario();
    revelar();  // siempre al final: observa también lo recién pintado
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
