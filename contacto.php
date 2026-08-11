<?php
/* ============================================================
   ENDPOINT DE CONTACTO — CESCHGROUP

   Recibe el formulario por JSON, valida en servidor y envía por
   mail(). El front mantiene WhatsApp como vía de respaldo: en
   hosting compartido un correo puede ser aceptado por mail() y
   descartado después por el filtro del destinatario, y eso el
   sitio no lo puede detectar.

   CONFIGURACIÓN: revisar DESTINO y REMITENTE antes de publicar.
   El remitente DEBE ser una casilla del propio dominio o el
   servidor lo marca como suplantación.
   ============================================================ */

declare(strict_types=1);

// ---- Configuración -----------------------------------------
const DESTINO         = 'contacto@ceschgroup.com';
const DESTINO_RECLAMO = 'contacto@ceschgroup.com';
const REMITENTE       = 'web@ceschgroup.com';
const SEGUNDOS_MINIMOS = 3;      // menos que esto es un bot
const MAX_CAMPO        = 5000;   // corte defensivo por campo

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/* Requiere PHP 8.0 o superior (usa str_starts_with). Se evita el tipo
   de retorno `never` a propósito: es 8.1+, y en 8.0 sería un error de
   parseo, es decir una pantalla en blanco en producción. */
function responder(int $codigo, array $cuerpo): void
{
    http_response_code($codigo);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, ['ok' => false, 'error' => 'Método no permitido.']);
}

$crudo = file_get_contents('php://input');
if ($crudo === false || strlen($crudo) > 64 * 1024) {
    responder(413, ['ok' => false, 'error' => 'Solicitud demasiado grande.']);
}

$datos = json_decode($crudo, true);
if (!is_array($datos)) {
    responder(400, ['ok' => false, 'error' => 'Formato inválido.']);
}

/* ---- Antispam ----------------------------------------------
   Honeypot: un campo oculto que ninguna persona ve ni completa.
   Tiempo mínimo: un humano no llena el formulario en 3 segundos.
   Los dos casos devuelven éxito para no enseñarle al bot cuál de
   sus intentos funciona. */
$trampa = trim((string)($datos['sitio_web'] ?? ''));
$abierto = (int)($datos['_t'] ?? 0);
$transcurrido = $abierto > 0 ? (time() - intdiv($abierto, 1000)) : PHP_INT_MAX;

if ($trampa !== '' || $transcurrido < SEGUNDOS_MINIMOS) {
    responder(200, ['ok' => true]);
}

/* ---- Validación -------------------------------------------- */
$esReclamo = ($datos['_tipo'] ?? '') === 'reclamo';

$requeridos = $esReclamo
    ? ['nombre', 'dni', 'telefono', 'correo', 'domicilio', 'descripcion', 'solicitud', 'detalle', 'pedido']
    : ['nombre', 'telefono', 'correo', 'interes', 'mensaje'];

$errores = [];
$limpio  = [];

foreach ($datos as $clave => $valor) {
    if (str_starts_with((string)$clave, '_') || $clave === 'sitio_web') {
        continue;
    }
    if (!is_scalar($valor)) {
        continue;
    }
    $texto = trim((string)$valor);
    if (mb_strlen($texto) > MAX_CAMPO) {
        $errores[$clave] = 'El contenido excede el largo permitido.';
        continue;
    }
    // Sin saltos de línea en cabeceras: evita inyección de headers.
    $limpio[(string)$clave] = str_replace(["\r", "\n"], ' ', $texto);
}

foreach ($requeridos as $campo) {
    if (($limpio[$campo] ?? '') === '') {
        $errores[$campo] = 'Este campo es obligatorio.';
    }
}

if (($limpio['correo'] ?? '') !== '' && !filter_var($limpio['correo'], FILTER_VALIDATE_EMAIL)) {
    $errores['correo'] = 'Revise el correo electrónico.';
}

if ($errores) {
    responder(422, ['ok' => false, 'errores' => $errores]);
}

/* ---- Armado del correo ------------------------------------- */
$asunto = $esReclamo
    ? 'Libro de reclamaciones — ' . $limpio['nombre']
    : 'Consulta desde la web — ' . $limpio['nombre'];

$rotulos = [
    'nombre'      => 'Nombre y apellidos',
    'entidad'     => 'Entidad o empresa',
    'telefono'    => 'Teléfono',
    'correo'      => 'Correo electrónico',
    'interes'     => 'Motivo',
    'mensaje'     => 'Consulta',
    'dni'         => 'Documento de identidad',
    'domicilio'   => 'Domicilio',
    'tipo'        => 'Tipo',
    'monto'       => 'Monto reclamado',
    'descripcion' => 'Descripción del bien o servicio',
    'solicitud'   => 'Tipo de solicitud',
    'detalle'     => 'Detalle',
    'pedido'      => 'Pedido del consumidor',
];

$lineas = [$asunto, str_repeat('=', mb_strlen($asunto)), ''];
foreach ($limpio as $clave => $valor) {
    if ($valor === '') {
        continue;
    }
    $lineas[] = ($rotulos[$clave] ?? ucfirst($clave)) . ': ' . $valor;
}
$lineas[] = '';
$lineas[] = 'Recibido: ' . date('d/m/Y H:i');
$lineas[] = 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'desconocida');

$cuerpo = implode("\n", $lineas);

$cabeceras = implode("\r\n", [
    'From: CESCHGROUP Web <' . REMITENTE . '>',
    'Reply-To: ' . $limpio['nombre'] . ' <' . $limpio['correo'] . '>',
    'Content-Type: text/plain; charset=utf-8',
    'X-Mailer: PHP/' . phpversion(),
]);

$destino = $esReclamo ? DESTINO_RECLAMO : DESTINO;
$enviado = @mail($destino, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, $cabeceras);

if (!$enviado) {
    // El front cae a WhatsApp con los datos ya cargados. No se pierde el contacto.
    responder(502, ['ok' => false, 'error' => 'No se pudo enviar el correo.']);
}

responder(200, ['ok' => true]);
