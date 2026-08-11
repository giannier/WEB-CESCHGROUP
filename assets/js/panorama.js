/* ============================================================
   RECORRIDO 360° — visor equirectangular en WebGL

   No usa three.js a propósito: la escena es una sola textura
   esférica. En vez de construir geometría, se dibuja un cuadrado
   que cubre la pantalla y el fragment shader calcula, por píxel,
   qué dirección mira y de dónde sacar el color de la panorámica.
   Eso son ~200 líneas contra los ~600 KB de un motor 3D completo.

   La textura NO se descarga al cargar la página: recién cuando el
   visitante abre el recorrido.
   ============================================================ */

(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var TAU = Math.PI * 2;
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function param(n) { return new URLSearchParams(window.location.search).get(n); }

  function obraActual() {
    if (typeof OBRAS === 'undefined') return null;
    var id = param('id');
    for (var i = 0; i < OBRAS.length; i++) if (OBRAS[i].id === id) return OBRAS[i];
    return null;
  }

  function hayWebgl() {
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) { return false; }
  }


  /* ==========================================================
     SHADERS
     ========================================================== */

  var VS = [
    'attribute vec2 aPos;',
    'varying vec2 vNdc;',
    'void main() {',
    '  vNdc = aPos;',
    '  gl_Position = vec4(aPos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'varying vec2 vNdc;',
    'uniform sampler2D uTex;',
    'uniform float uAspect;',
    'uniform float uYaw;',
    'uniform float uPitch;',
    'uniform float uFov;',
    'const float PI = 3.14159265359;',
    'void main() {',
    '  float t = tan(uFov * 0.5);',
    // Rayo de la cámara para este píxel, mirando hacia -Z.
    '  vec3 d = normalize(vec3(vNdc.x * t * uAspect, vNdc.y * t, -1.0));',
    // Cabeceo sobre X, después giro sobre Y: lleva el rayo al mundo.
    '  float cp = cos(uPitch), sp = sin(uPitch);',
    '  d = vec3(d.x, d.y * cp - d.z * sp, d.y * sp + d.z * cp);',
    '  float cy = cos(uYaw), sy = sin(uYaw);',
    '  d = vec3(d.x * cy + d.z * sy, d.y, -d.x * sy + d.z * cy);',
    // Dirección → coordenada equirectangular.
    '  float u = atan(d.x, -d.z) / (2.0 * PI) + 0.5;',
    '  float v = acos(clamp(d.y, -1.0, 1.0)) / PI;',
    '  gl_FragColor = texture2D(uTex, vec2(u, v));',
    '}'
  ].join('\n');

  function compilar(gl, tipo, fuente) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }


  /* ==========================================================
     VISOR
     ========================================================== */

  function crearVisor(obra) {
    var escenas = obra.panorama;
    var indice = 0;

    var visor = document.createElement('div');
    visor.className = 'pano-visor';
    visor.setAttribute('role', 'dialog');
    visor.setAttribute('aria-modal', 'true');
    visor.setAttribute('aria-label', 'Recorrido 360 grados de la obra');
    visor.innerHTML =
      '<canvas class="pano-lienzo"></canvas>' +
      '<div class="pano-chrome">' +
        '<div class="pano-cabecera">' +
          '<p class="pano-nombre"></p>' +
          '<button type="button" class="pano-cerrar" aria-label="Cerrar recorrido 360">✕</button>' +
        '</div>' +
        '<div class="pano-saltos"></div>' +
        '<p class="pano-ayuda">Arrastre para mirar alrededor</p>' +
      '</div>' +
      '<div class="pano-cargando">Cargando escena…</div>';
    document.body.appendChild(visor);

    var lienzo   = $('.pano-lienzo', visor);
    var nombre   = $('.pano-nombre', visor);
    var cargando = $('.pano-cargando', visor);
    var contSaltos = $('.pano-saltos', visor);
    var btnCerrar  = $('.pano-cerrar', visor);
    var ayuda      = $('.pano-ayuda', visor);

    var gl = lienzo.getContext('webgl') || lienzo.getContext('experimental-webgl');
    if (!gl) return null;

    var vs = compilar(gl, gl.VERTEX_SHADER, VS);
    var fs = compilar(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    // Un cuadrado que cubre toda la pantalla. Toda la esfera vive en el shader.
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uAspect = gl.getUniformLocation(prog, 'uAspect');
    var uYaw    = gl.getUniformLocation(prog, 'uYaw');
    var uPitch  = gl.getUniformLocation(prog, 'uPitch');
    var uFov    = gl.getUniformLocation(prog, 'uFov');

    var textura = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textura);
    // Un píxel del azul de marca mientras la foto viaja: nunca se ve negro roto.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([6, 36, 64, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var yaw = 0, pitch = 0, fov = 1.15;
    var lazo = null, abierto = false, disparador = null;
    var arrastra = false, ultimoX = 0, ultimoY = 0;
    var inerciaX = 0, inerciaY = 0;

    function medir() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.floor(visor.clientWidth * dpr);
      var h = Math.floor(visor.clientHeight * dpr);
      if (lienzo.width !== w || lienzo.height !== h) {
        lienzo.width = w; lienzo.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function dibujar() {
      medir();
      if (!arrastra) {
        // Deriva suave hasta detenerse; da sensación de peso.
        yaw += inerciaX; pitch += inerciaY;
        inerciaX *= 0.94; inerciaY *= 0.94;
        if (Math.abs(inerciaX) < 1e-5) inerciaX = 0;
        if (Math.abs(inerciaY) < 1e-5) inerciaY = 0;
      }
      // El cabeceo se topa antes de la vertical para que no se dé vuelta.
      pitch = Math.max(-1.45, Math.min(1.45, pitch));

      gl.uniform1f(uAspect, lienzo.width / lienzo.height);
      gl.uniform1f(uYaw, yaw);
      gl.uniform1f(uPitch, pitch);
      gl.uniform1f(uFov, fov);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      ubicarSaltos();
      lazo = requestAnimationFrame(dibujar);
    }

    /* Proyecta cada punto de salto a coordenadas de pantalla,
       deshaciendo la rotación de cámara del shader. */
    function ubicarSaltos() {
      var escena = escenas[indice];
      if (!escena.saltos) return;
      var t = Math.tan(fov * 0.5);
      var aspect = lienzo.width / lienzo.height;
      var cy = Math.cos(-yaw), sy = Math.sin(-yaw);
      var cp = Math.cos(-pitch), sp = Math.sin(-pitch);

      Array.prototype.forEach.call(contSaltos.children, function (nodo, i) {
        var s = escena.saltos[i];
        if (!s) return;
        var lon = (s.x - 0.5) * TAU;
        var pol = s.y * Math.PI;
        var d = {
          x: Math.sin(pol) * Math.sin(lon),
          y: Math.cos(pol),
          z: -Math.sin(pol) * Math.cos(lon)
        };
        // Inversa del giro, después inversa del cabeceo.
        var x1 = d.x * cy + d.z * sy, z1 = -d.x * sy + d.z * cy;
        var y2 = d.y * cp - z1 * sp,  z2 = d.y * sp + z1 * cp;

        if (z2 >= -0.05) { nodo.style.display = 'none'; return; }
        var ndcX = (x1 / -z2) / (t * aspect);
        var ndcY = (y2 / -z2) / t;
        if (Math.abs(ndcX) > 1.1 || Math.abs(ndcY) > 1.1) { nodo.style.display = 'none'; return; }
        nodo.style.display = '';
        nodo.style.left = ((ndcX * 0.5 + 0.5) * 100) + '%';
        nodo.style.top  = ((0.5 - ndcY * 0.5) * 100) + '%';
      });
    }

    function pintarSaltos() {
      var escena = escenas[indice];
      contSaltos.innerHTML = (escena.saltos || []).map(function (s) {
        return '<button type="button" class="pano-salto" data-a="' + esc(s.a) + '">' +
               esc(s.rotulo) + '</button>';
      }).join('');
      Array.prototype.forEach.call(contSaltos.children, function (b) {
        b.addEventListener('click', function () { irA(b.dataset.a); });
      });
    }

    function cargarEscena(i, alListo) {
      indice = i;
      var escena = escenas[i];
      nombre.textContent = escena.nombre;
      cargando.hidden = false;
      cargando.textContent = 'Cargando escena…';

      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, textura);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        cargando.hidden = true;
        pintarSaltos();
        if (alListo) alListo();
      };
      img.onerror = function () {
        cargando.hidden = false;
        cargando.textContent = 'No se pudo cargar esta escena 360°.';
      };
      img.src = escena.imagen;
    }

    function irA(id) {
      var destino = -1;
      for (var i = 0; i < escenas.length; i++) if (escenas[i].id === id) destino = i;
      if (destino < 0) return;
      // Fundido corto: la escena nueva no aparece de golpe.
      lienzo.style.transition = 'opacity .25s ease';
      lienzo.style.opacity = '0';
      setTimeout(function () {
        cargarEscena(destino, function () { lienzo.style.opacity = '1'; });
      }, 250);
    }

    /* --- entrada del usuario --- */
    function inicioArrastre(x, y) { arrastra = true; ultimoX = x; ultimoY = y; inerciaX = 0; inerciaY = 0; }
    function moverArrastre(x, y) {
      if (!arrastra) return;
      var dx = (x - ultimoX) * 0.0035;
      var dy = (y - ultimoY) * 0.0035;
      yaw -= dx; pitch -= dy;
      inerciaX = -dx * 0.6; inerciaY = -dy * 0.6;
      ultimoX = x; ultimoY = y;
      if (ayuda) ayuda.style.opacity = '0';
    }
    function finArrastre() { arrastra = false; }

    lienzo.addEventListener('mousedown', function (e) { inicioArrastre(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function (e) { moverArrastre(e.clientX, e.clientY); });
    window.addEventListener('mouseup', finArrastre);
    lienzo.addEventListener('touchstart', function (e) {
      inicioArrastre(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    lienzo.addEventListener('touchmove', function (e) {
      moverArrastre(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    lienzo.addEventListener('touchend', finArrastre);
    lienzo.addEventListener('wheel', function (e) {
      e.preventDefault();
      fov = Math.max(0.6, Math.min(1.7, fov + e.deltaY * 0.0012));
    }, { passive: false });

    visor.addEventListener('keydown', function (e) {
      var paso = 0.09;
      if (e.key === 'ArrowLeft')  { yaw -= paso; e.preventDefault(); }
      if (e.key === 'ArrowRight') { yaw += paso; e.preventDefault(); }
      if (e.key === 'ArrowUp')    { pitch += paso; e.preventDefault(); }
      if (e.key === 'ArrowDown')  { pitch -= paso; e.preventDefault(); }
      if (e.key === 'Escape') cerrar();
      // El foco no se escapa del visor mientras está abierto.
      if (e.key === 'Tab') { e.preventDefault(); btnCerrar.focus(); }
    });

    function abrir(desde) {
      if (abierto) return;
      abierto = true;
      disparador = desde || null;
      visor.classList.add('abierto');
      document.body.style.overflow = 'hidden';
      if (ayuda) ayuda.style.opacity = '1';
      cargarEscena(0);
      if (!lazo) lazo = requestAnimationFrame(dibujar);
      btnCerrar.focus();
    }

    function cerrar() {
      if (!abierto) return;
      abierto = false;
      visor.classList.remove('abierto');
      document.body.style.overflow = '';
      // Se apaga el lazo: un rAF vivo detrás de un overlay cerrado es CPU regalada.
      if (lazo) { cancelAnimationFrame(lazo); lazo = null; }
      if (disparador) disparador.focus();
    }

    btnCerrar.addEventListener('click', cerrar);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && lazo) { cancelAnimationFrame(lazo); lazo = null; }
      else if (!document.hidden && abierto && !lazo) lazo = requestAnimationFrame(dibujar);
    });

    return { abrir: abrir, cerrar: cerrar };
  }


  /* ==========================================================
     ENTRADA AL RECORRIDO
     ========================================================== */

  function iniciar() {
    var destino = document.querySelector('#pano-entrada');
    if (!destino) return;

    var obra = obraActual();
    if (!obra || !obra.panorama || !obra.panorama.length) return;

    var soportado = hayWebgl();

    destino.innerHTML =
      '<div class="pano-entrada">' +
        '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">' +
          '<ellipse cx="24" cy="24" rx="20" ry="9"/><circle cx="24" cy="24" r="14"/>' +
          '<path d="M24 10v28M10 24h28"/>' +
        '</svg>' +
        '<h3>Recorrido 360° de la obra</h3>' +
        (soportado
          ? '<p>Párese dentro de la obra y mire alrededor. ' +
            (obra.panorama.length > 1
              ? 'Puede saltar entre ' + obra.panorama.length + ' posiciones.'
              : '') + '</p>' +
            '<button type="button" class="boton boton--acento" data-abrir-360>Entrar al recorrido</button>'
          : '<p>Su navegador no puede mostrar el recorrido 360°. ' +
            'Más abajo está el registro fotográfico completo de la obra.</p>') +
      '</div>';
    destino.hidden = false;

    if (!soportado) return;

    var visor = null;
    var boton = destino.querySelector('[data-abrir-360]');
    boton.addEventListener('click', function () {
      // El visor se construye la primera vez que alguien lo pide,
      // no al cargar la página.
      if (!visor) visor = crearVisor(obra);
      if (!visor) {
        boton.disabled = true;
        boton.textContent = 'Recorrido no disponible';
        return;
      }
      visor.abrir(boton);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
