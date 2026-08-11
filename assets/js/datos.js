/* ============================================================
   DATOS DEL SITIO — este es el archivo que se edita para
   actualizar la empresa y las obras. No hay que tocar el HTML.
   ============================================================ */

const EMPRESA = {
  nombre: "CESCHGROUP",
  bajada: "Construcción & Supervisión",
  razonSocial: "CESCHGROUP S.A.C.",     // ← confirmar razón social exacta
  ruc: "20XXXXXXXXX",                   // ← reemplazar
  telefono: "(074) 000 000",
  celular: "+51 900 000 000",
  whatsapp: "51900000000",              // solo dígitos, con código de país
  email: "contacto@ceschgroup.com",           // ← confirmar dominio real
  emailLicitaciones: "licitaciones@ceschgroup.com",
  direccion: "Av. Referencial 000, Chiclayo — Lambayeque, Perú",
  horario: "Lunes a viernes de 8:00 a. m. a 6:00 p. m.",
  redes: {
    facebook: "#",
    instagram: "#",
    linkedin: "#"
  }
};

/* ------------------------------------------------------------
   OBRAS
   estado: "ejecucion" | "culminada" | "proyecto"
   avance: 0–100 (solo relevante en ejecución)
   foto:   ruta de la imagen. Si el archivo no existe, la ficha
           muestra un marco con el rótulo "Registro fotográfico".

   CAMPOS INMERSIVOS — todos opcionales. La ficha muestra el nivel
   más rico que tenga la obra y omite en silencio lo que falte:

   recorrido[]    Etapas del recorrido cinematográfico.
                  foco {x, y, zoom}  coordenadas 0–1 sobre la foto;
                                     el paneo se dirige a ese punto.
                  hotspots[] {x, y, rotulo}  también 0–1, quedan
                                     clavados a la foto mientras panea.
   antesDespues   {antes, despues, rotuloAntes, rotuloDespues}
                  Comparador de arrastre. Si falta una de las dos
                  imágenes, el bloque no se dibuja.
   panorama[]     Escenas 360°. {id, nombre, imagen, saltos[]}
                  saltos {a, x, y, rotulo} enlazan a otra escena
                  por su id. Solo obras emblemáticas: exige salir
                  a fotografiar con cámara 360.
   ------------------------------------------------------------ */

const OBRAS = [
  {
    id: "puente-reque",
    codigo: "OB-2026-014",
    nombre: "Puente vehicular sobre el río Reque",
    resumen: "Puente de 120 m de luz con estructura mixta acero–concreto, accesos y defensas ribereñas, ejecutado bajo la modalidad de suma alzada.",
    estado: "ejecucion",
    avance: 62,
    tipo: "Infraestructura vial",
    servicio: "Construcción",
    cliente: "Gobierno Regional de Lambayeque",
    ubicacion: "Reque, Chiclayo — Lambayeque",
    monto: "S/ 18.4 MM",
    plazo: "540 días calendario",
    inicio: "Marzo 2025",
    fin: "Agosto 2026",
    modalidad: "Suma alzada",
    destacada: true,
    foto: "assets/img/obras/puente-reque.jpg",
    alcance: [
      "Excavación y cimentación profunda con pilotes de 1.20 m de diámetro",
      "Montaje de vigas metálicas y losa de concreto f'c = 350 kg/cm²",
      "Accesos, badenes y obras de arte menores",
      "Defensas ribereñas con enrocado en ambas márgenes"
    ],

    /* Recorrido cinematográfico. Cada etapa es una parada del scroll.
       Mientras no exista la foto, la etapa muestra su marco rotulado. */
    recorrido: [
      {
        foto: "assets/img/obras/reque/01-cimentacion.jpg",
        titulo: "Cimentación profunda",
        texto: "Perforación de pilotes hasta el estrato resistente, verificada con ensayo de integridad.",
        foco: { x: 0.36, y: 0.64, zoom: 1.35 },
        hotspots: [
          { x: 0.36, y: 0.64, rotulo: "Pilote Ø 1.20 m" },
          { x: 0.72, y: 0.45, rotulo: "Encofrado metálico" }
        ]
      },
      {
        foto: "assets/img/obras/reque/02-vigas.jpg",
        titulo: "Montaje de vigas metálicas",
        texto: "Izaje de vigas de 120 m de luz con grúa de 300 t y control topográfico permanente.",
        foco: { x: 0.5, y: 0.38, zoom: 1.25 },
        hotspots: [
          { x: 0.5, y: 0.38, rotulo: "Viga mixta acero–concreto" },
          { x: 0.18, y: 0.7, rotulo: "Apoyo de neopreno" }
        ]
      },
      {
        foto: "assets/img/obras/reque/03-losa.jpg",
        titulo: "Vaciado de losa",
        texto: "Losa de concreto f'c = 350 kg/cm² con curado controlado y probetas por cada 50 m³.",
        foco: { x: 0.6, y: 0.55, zoom: 1.3 },
        hotspots: [
          { x: 0.6, y: 0.55, rotulo: "f'c = 350 kg/cm²" }
        ]
      }
    ],

    antesDespues: {
      antes: "assets/img/obras/reque/antes.jpg",
      despues: "assets/img/obras/reque/despues.jpg",
      rotuloAntes: "Marzo 2025",
      rotuloDespues: "Agosto 2026"
    },

    /* Recorrido 360°. Solo obras emblemáticas: exige cámara 360 en campo. */
    panorama: [
      {
        id: "tablero",
        nombre: "Tablero del puente",
        imagen: "assets/img/obras/reque/360-tablero.jpg",
        saltos: [
          { a: "estribo-sur", x: 0.18, y: 0.54, rotulo: "Estribo sur" }
        ]
      },
      {
        id: "estribo-sur",
        nombre: "Estribo sur",
        imagen: "assets/img/obras/reque/360-estribo-sur.jpg",
        saltos: [
          { a: "tablero", x: 0.82, y: 0.5, rotulo: "Volver al tablero" }
        ]
      }
    ]
  },
  {
    id: "agua-potable-monsefu",
    codigo: "OB-2025-009",
    nombre: "Mejoramiento del servicio de agua potable y alcantarillado",
    resumen: "Renovación de 24 km de redes, dos reservorios apoyados y conexiones domiciliarias para 3 200 viviendas del centro urbano.",
    estado: "ejecucion",
    avance: 38,
    tipo: "Saneamiento",
    servicio: "Construcción",
    cliente: "Municipalidad Provincial",
    ubicacion: "Monsefú — Lambayeque",
    monto: "S/ 12.1 MM",
    plazo: "420 días calendario",
    inicio: "Noviembre 2025",
    fin: "Enero 2027",
    modalidad: "Precios unitarios",
    destacada: true,
    foto: "assets/img/obras/agua-monsefu.jpg",
    alcance: [
      "24 km de redes de agua potable en PVC UF",
      "Dos reservorios apoyados de 800 m³",
      "3 200 conexiones domiciliarias con micromedición",
      "Reposición de pavimentos y veredas"
    ]
  },
  {
    id: "colegio-jlo",
    codigo: "SV-2025-021",
    nombre: "Supervisión de la I. E. José Leonardo Ortiz",
    resumen: "Supervisión integral de la ejecución de tres pabellones académicos, losa deportiva y cerco perimétrico, con control de calidad y valorizaciones mensuales.",
    estado: "ejecucion",
    avance: 74,
    tipo: "Edificación educativa",
    servicio: "Supervisión",
    cliente: "PRONIED",
    ubicacion: "José Leonardo Ortiz — Chiclayo",
    monto: "S/ 1.9 MM",
    plazo: "360 días calendario",
    inicio: "Junio 2025",
    fin: "Junio 2026",
    modalidad: "Consultoría de obra",
    destacada: true,
    foto: "assets/img/obras/colegio-jlo.jpg",
    alcance: [
      "Revisión y compatibilización del expediente técnico",
      "Control de calidad de concreto, acero y acabados",
      "Valorizaciones mensuales y control del cronograma",
      "Gestión de adicionales, deductivos y ampliaciones de plazo"
    ],

    /* Esta obra tiene recorrido pero no 360°: la ficha muestra el
       recorrido y no ofrece la entrada a panorama. */
    recorrido: [
      {
        foto: "assets/img/obras/jlo/01-pabellones.jpg",
        titulo: "Pabellones académicos",
        texto: "Tres pabellones de dos niveles con sistema aporticado y albañilería confinada.",
        foco: { x: 0.45, y: 0.5, zoom: 1.28 },
        hotspots: [
          { x: 0.45, y: 0.5, rotulo: "Pórtico de concreto armado" }
        ]
      },
      {
        foto: "assets/img/obras/jlo/02-losa-deportiva.jpg",
        titulo: "Losa deportiva",
        texto: "Losa multiuso con graderías y cerco perimétrico, verificada por ensayo de esclerometría.",
        foco: { x: 0.55, y: 0.6, zoom: 1.2 },
        hotspots: []
      }
    ],

    antesDespues: {
      antes: "assets/img/obras/jlo/antes.jpg",
      despues: "assets/img/obras/jlo/despues.jpg",
      rotuloAntes: "Junio 2025",
      rotuloDespues: "Junio 2026"
    }
  },
  {
    id: "pistas-veredas-pimentel",
    codigo: "OB-2024-006",
    nombre: "Pistas y veredas — Urbanización Costa Azul",
    resumen: "Pavimentación de 4.6 km de vías locales, veredas, sardineles y señalización horizontal y vertical, entregada dentro del plazo contractual.",
    estado: "culminada",
    avance: 100,
    tipo: "Infraestructura vial",
    servicio: "Construcción",
    cliente: "Municipalidad Distrital",
    ubicacion: "Pimentel — Chiclayo",
    monto: "S/ 7.3 MM",
    plazo: "300 días calendario",
    inicio: "Enero 2024",
    fin: "Diciembre 2024",
    modalidad: "Precios unitarios",
    destacada: true,
    foto: "assets/img/obras/pimentel.jpg",
    alcance: [
      "4.6 km de pavimento flexible sobre base granular",
      "Veredas de concreto y rampas accesibles",
      "Drenaje pluvial superficial",
      "Señalización horizontal y vertical"
    ]
  },
  {
    id: "planta-agroindustrial",
    codigo: "OB-2024-002",
    nombre: "Planta de proceso agroindustrial",
    resumen: "Nave industrial de 4 800 m² con estructura metálica, cámaras de frío, subestación eléctrica y patio de maniobras para exportación.",
    estado: "culminada",
    avance: 100,
    tipo: "Edificación industrial",
    servicio: "Construcción",
    cliente: "Cliente privado",
    ubicacion: "Motupe — Lambayeque",
    monto: "S/ 9.8 MM",
    plazo: "330 días calendario",
    inicio: "Febrero 2024",
    fin: "Enero 2025",
    modalidad: "Llave en mano",
    destacada: false,
    foto: "assets/img/obras/planta-motupe.jpg",
    alcance: [
      "Nave de estructura metálica de 4 800 m²",
      "Cámaras de frío y sala de proceso",
      "Subestación eléctrica de 630 kVA",
      "Patio de maniobras y áreas administrativas"
    ]
  },
  {
    id: "defensa-riberena-la-leche",
    codigo: "SV-2023-017",
    nombre: "Supervisión de defensas ribereñas del río La Leche",
    resumen: "Supervisión de 8.2 km de diques y enrocado de protección ejecutados bajo el marco de reconstrucción con cambios.",
    estado: "culminada",
    avance: 100,
    tipo: "Obras hidráulicas",
    servicio: "Supervisión",
    cliente: "ARCC",
    ubicacion: "Íllimo — Lambayeque",
    monto: "S/ 2.4 MM",
    plazo: "270 días calendario",
    inicio: "Marzo 2023",
    fin: "Diciembre 2023",
    modalidad: "Consultoría de obra",
    destacada: false,
    foto: "assets/img/obras/la-leche.jpg",
    alcance: [
      "Control topográfico permanente del eje del dique",
      "Verificación de canteras y calidad del enrocado",
      "Informes mensuales y expediente de liquidación",
      "Cierre y transferencia de la obra al sector"
    ]
  },
  {
    id: "hospital-modular",
    codigo: "PR-2026-003",
    nombre: "Centro de salud tipo I-4",
    resumen: "Expediente técnico y propuesta constructiva para un centro de salud de dos niveles con área de emergencia, farmacia y consultorios.",
    estado: "proyecto",
    avance: 0,
    tipo: "Edificación de salud",
    servicio: "Proyectos",
    cliente: "Municipalidad Distrital",
    ubicacion: "Lambayeque",
    monto: "S/ 14.0 MM (referencial)",
    plazo: "480 días calendario",
    inicio: "Por definir",
    fin: "Por definir",
    modalidad: "En estructuración",
    destacada: false,
    foto: "assets/img/obras/centro-salud.jpg",
    alcance: [
      "Estudios básicos: topografía, suelos e impacto ambiental",
      "Anteproyecto arquitectónico y especialidades",
      "Presupuesto, cronograma y análisis de precios unitarios",
      "Expediente técnico listo para convocatoria"
    ]
  },
  {
    id: "parque-industrial",
    codigo: "PR-2026-005",
    nombre: "Habilitación urbana industrial",
    resumen: "Proyecto de habilitación de 12 hectáreas con vías, redes de agua, desagüe y media tensión para lotes industriales.",
    estado: "proyecto",
    avance: 0,
    tipo: "Habilitación urbana",
    servicio: "Proyectos",
    cliente: "Consorcio privado",
    ubicacion: "Chiclayo — Lambayeque",
    monto: "S/ 21.5 MM (referencial)",
    plazo: "600 días calendario",
    inicio: "Por definir",
    fin: "Por definir",
    modalidad: "En estructuración",
    destacada: false,
    foto: "assets/img/obras/parque-industrial.jpg",
    alcance: [
      "Lotización y diseño vial de 12 ha",
      "Redes de agua potable y alcantarillado",
      "Red de media tensión y alumbrado",
      "Gestión de licencias y aprobaciones"
    ]
  }
];

/* ------------------------------------------------------------ */

const ESTADOS = {
  ejecucion: { texto: "En ejecución", clase: "ejecucion" },
  culminada: { texto: "Culminada",    clase: "culminada" },
  proyecto:  { texto: "Proyecto",     clase: "proyecto"  }
};

const SERVICIOS = [
  {
    titulo: "Ejecución de obras",
    texto: "Construimos infraestructura vial, saneamiento, edificación y obras hidráulicas para entidades públicas y clientes privados.",
    items: ["Obras viales y pavimentación", "Saneamiento y redes", "Edificación e industria", "Obras hidráulicas"],
    icono: "grua"
  },
  {
    titulo: "Supervisión de obras",
    texto: "Verificamos que lo ejecutado corresponda al expediente técnico, en plazo, costo y calidad, con documentación lista para auditoría.",
    items: ["Control de calidad y ensayos", "Valorizaciones mensuales", "Control de cronograma", "Adicionales y ampliaciones"],
    icono: "casco"
  },
  {
    titulo: "Expedientes técnicos",
    texto: "Elaboramos y revisamos expedientes completos: estudios básicos, diseño de especialidades, presupuesto y cronograma.",
    items: ["Topografía y mecánica de suelos", "Diseño por especialidades", "Presupuesto y APU", "Compatibilización"],
    icono: "plano"
  },
  {
    titulo: "Gestión y liquidación",
    texto: "Acompañamos el cierre de la obra hasta la liquidación y transferencia, con el sustento técnico y contable ordenado.",
    items: ["Liquidación técnico–financiera", "Expediente de cierre", "Transferencia al sector", "Saneamiento documentario"],
    icono: "carpeta"
  }
];

const CIFRAS = [
  { valor: 48,  sufijo: "",    rotulo: "Obras entregadas" },
  { valor: 15,  sufijo: "",    rotulo: "Años de experiencia" },
  { valor: 120, sufijo: " MM", rotulo: "Soles ejecutados" },
  { valor: 100, sufijo: " %",  rotulo: "Obras sin arbitraje" }
];
