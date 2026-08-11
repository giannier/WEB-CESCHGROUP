# CESCHGROUP — Sitio web

Sitio estático (HTML + CSS + JS, sin build) con un endpoint PHP para el
formulario. Se despliega por `git pull` en hosting cPanel.

## Páginas

| Archivo | Contenido |
|---|---|
| `index.html` | Portada: carrusel de obras destacadas, buscador, cifras, servicios, portafolio, proceso, clientes |
| `nosotros.html` | La empresa, misión, visión, principios, equipo |
| `servicios.html` | Ejecución, supervisión, expedientes técnicos, liquidación |
| `obras.html` | Portafolio con filtros: todas / en ejecución / culminadas / proyectos |
| `obra.html?id=…` | Ficha técnica + **recorrido inmersivo** de una obra |
| `contacto.html` | Formulario, datos y mapa |
| `libro-de-reclamaciones.html` | Formulario obligatorio del Código del Consumidor |

## Ver el sitio en la computadora

Abrir el HTML con doble clic no alcanza: `obra.html?id=…` necesita servidor.

```bash
npx serve .                  # Node
php -S localhost:8080        # PHP: además prueba el formulario de verdad
```

## Los tres archivos que se editan

### 1. `assets/css/marca.css` — colores y tipografía

Cuando marketing entregue la paleta definitiva se cambian los hex de la sección
`COLORES DE MARCA`. No hay ni un color escrito a mano en el resto del CSS.

| Variable | Uso |
|---|---|
| `--c-primario` | Azul corporativo: cabeceras oscuras, botones sólidos, pie |
| `--c-acento` | Verde corporativo: llamados a la acción, avances, hotspots |
| `--c-ejecucion` | Verde — obra en marcha |
| `--c-culminada` | Azul — obra entregada |
| `--c-proyecto` | Pizarra — cartera sin ejecutar |

Para la tipografía se cambian `--f-display`, `--f-texto` y `--f-dato`, y el
`<link>` de Google Fonts en el `<head>` de las siete páginas.

### 2. `assets/js/datos.js` — empresa y obras

`EMPRESA` alimenta cabecera, pie, contacto y todos los botones de WhatsApp.
`OBRAS` alimenta portada, listado y ficha. `SERVICIOS` y `CIFRAS`, la portada.

Para agregar una obra se copia un bloque y se cambian los datos. No se toca
ningún HTML.

### 3. Imágenes

Van en `assets/img/obras/`. **Si el archivo no existe, la tarjeta muestra un
marco rotulado en vez de romperse**: la foto se inserta recién cuando el
navegador confirma que cargó.

- Fotos de obra: JPG o WebP, 1600 × 1200 px, **menos de 300 KB**.
- Panorámicas 360°: JPG equirectangular, **relación exacta 2:1**
  (4096 × 2048 recomendado), menos de 1.5 MB.
- Logo: reemplazar `<span class="isotipo">` por `<img src="assets/img/logo.svg">`
  en las siete páginas (aparece dos veces por página: cabecera y pie).
- Favicon: `assets/img/favicon.png` — hoy hay uno provisional de marca.

> Las imágenes que están hoy en `assets/img/obras/` son **de muestra** y lo
> dicen encima. Sirven para ver el recorrido funcionando; se reemplazan por las
> fotos reales sin tocar código, respetando los nombres de `datos.js`.

---

## Recorrido inmersivo

Cada obra muestra el nivel más rico que sus datos permitan y **omite en
silencio lo que falte**. Una obra sin datos inmersivos se ve exactamente como
antes: ni una sección vacía ni un título huérfano.

### Capa 1 — recorrido cinematográfico

Funciona con fotos normales, incluso de celular. Al bajar, la foto panea y hace
zoom hacia el punto de interés y aparecen los hotspots técnicos.

```js
recorrido: [
  {
    foto: "assets/img/obras/reque/01-cimentacion.jpg",
    titulo: "Cimentación profunda",
    texto: "Pilotes perforados hasta el estrato resistente.",
    foco: { x: 0.36, y: 0.64, zoom: 1.35 },   // 0–1 sobre la foto
    hotspots: [
      { x: 0.36, y: 0.64, rotulo: "Pilote Ø 1.20 m" }
    ]
  }
]
```

`foco` y `hotspots` usan coordenadas de 0 a 1 sobre la foto, no píxeles: si
mañana se recorta o se cambia de resolución, los puntos siguen en su lugar.
`zoom` va de 1 a 2.

### Comparador antes/después

```js
antesDespues: {
  antes:   "assets/img/obras/reque/antes.jpg",
  despues: "assets/img/obras/reque/despues.jpg",
  rotuloAntes:   "Marzo 2025",
  rotuloDespues: "Agosto 2026"
}
```

Si falta una de las dos imágenes, el comparador no se dibuja y se muestra la
que exista como figura suelta.

### Capa 2 — recorrido 360°

Solo obras emblemáticas: **exige salir a fotografiar con cámara 360**.

```js
panorama: [
  {
    id: "tablero",
    nombre: "Tablero del puente",
    imagen: "assets/img/obras/reque/360-tablero.jpg",
    saltos: [ { a: "estribo-sur", x: 0.18, y: 0.52, rotulo: "Estribo sur" } ]
  }
]
```

`saltos` enlaza a otra escena por su `id` y se posiciona con coordenadas 0–1
sobre la panorámica. La textura **no se descarga** hasta que el visitante entra
al recorrido.

**Importante para la captura:** una obra culminada hace años ya no se puede
fotografiar en construcción. El 360 rinde de verdad en las obras que están en
ejecución ahora.

### Movimiento reducido

Con `prefers-reduced-motion: reduce` el recorrido no se degrada: se convierte
en una galería vertical con cada texto y cada rótulo de hotspot legibles sin
scroll. La información técnica es el producto y no puede depender del
movimiento.

---

## Formulario

`contacto.php` recibe el envío por JSON, valida en servidor y manda el correo.
Si el correo no sale, el sitio **ofrece WhatsApp con el mensaje ya armado y no
borra lo que la persona escribió**. En hosting compartido un correo puede ser
aceptado y descartado después por el filtro del destinatario, y eso el sitio no
lo puede detectar.

Antes de publicar hay que revisar en `contacto.php`:

```php
const DESTINO   = 'contacto@ceschgroup.com';
const REMITENTE = 'web@ceschgroup.com';   // DEBE ser casilla del propio dominio
```

Si el remitente no pertenece al dominio, el servidor lo marca como suplantación
y el correo no llega.

Antispam: campo trampa oculto más tiempo mínimo de llenado. Sin CAPTCHA a
propósito: cobra peaje a todas las personas para frenar bots que la trampa ya
frena a este volumen de tráfico.

---

## Despliegue en cPanel

1. En cPanel → **Git Version Control** → crear repositorio apuntando a
   `public_html` (o al subdirectorio del dominio).
2. Configurar el remoto y hacer `git push`. En cPanel, **Update from Remote**
   y luego **Deploy HEAD Commit**.
3. Verificar que **PHP 8.0 o superior** esté seleccionado en *MultiPHP Manager*.
   `contacto.php` usa `str_starts_with`, que es 8.0+.
4. Emitir el SSL en *SSL/TLS Status* y recién entonces descomentar el bloque
   HTTPS de `.htaccess`.
5. Enviar una consulta de prueba desde `contacto.html` y confirmar que llega.

`.htaccess` ya trae compresión, caché, cabeceras de seguridad y bloqueo de
`openspec/`, `.git/` y `LEEME.md`. `datos.js` se sirve sin caché a propósito:
si no, una obra nueva tardaría una semana en aparecer.

---

## Estructura

```
assets/
  css/    marca.css · estilos.css · inmersivo.css
  js/     datos.js · app.js · recorrido.js · panorama.js
  vendor/ gsap/  (GSAP 3.12.5 + ScrollTrigger + Flip, vendorizado)
  img/    favicon.png · obras/
openspec/ documentación SDD del proyecto (no se publica)
contacto.php · .htaccess · .gitignore
```

`recorrido.js` y `panorama.js` son **opcionales**: si se borran sus tres
`<script>` y el `<link>` de `inmersivo.css` en `obra.html`, el sitio vuelve a
su versión simple sin ningún otro cambio.

GSAP está vendorizado, no en CDN: el despliegue es `git pull`, así que todo lo
que el navegador necesita está commiteado.

---

## Detalles ya resueltos

- Responsive verificado en 360, 390, 768, 1024 y 1440 px, sin desborde
  horizontal, con menú lateral en móvil
- Foco visible por teclado; hotspots, comparador y visor 360 operables sin mouse
- `prefers-reduced-motion` respetado en todo el recorrido
- Áreas táctiles de 44 px como mínimo en hotspots y controles
- `title`, `meta description`, `canonical` y Open Graph por página
- `obra.html` con un `id` inexistente muestra un aviso, no una página rota
- Ninguna imagen faltante rompe nada: siempre hay marco rotulado

## Pendientes antes de publicar

1. Confirmar razón social, RUC, teléfonos, correos y dirección en `datos.js`
2. Cargar logo, favicon y fotos reales de obra
3. Reemplazar las obras de ejemplo por el portafolio real
4. Definir qué 2–3 obras llevan captura 360° y agendar la sesión de fotos
5. Cambiar el `src` del mapa de `contacto.html` por la ubicación real
6. Reemplazar `https://www.dominio.pe/` en los `canonical` de las siete páginas
7. Revisar `DESTINO` y `REMITENTE` en `contacto.php`
8. Agregar Google Analytics / Search Console y generar `sitemap.xml`
