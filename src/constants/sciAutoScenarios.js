// Escenarios de simulación con narrativa progresiva y zonas SCI automáticas.
//
// Cada evento puede tener:
//   narrativeLog: entradas del registro inyectadas al disparar
//   sciZones:     zonas especiales SCI (PC, ACV, Triage, Staging, Helipuerto)
//                 colocadas automáticamente al disparar el evento

export const SCI_AUTO_SCENARIOS = {
  'sismo-7-5': {
    key: 'sismo-7-5',
    name: 'Sismo 7.5 Mw — CDMX',
    description: 'Terremoto de magnitud 7.5 con epicentro en Guerrero. Daños en cascada en 6 alcaldías, colapsos múltiples, incendios y fuga química. Activación Plan DN-III.',
    icon: '🌐',
    severity: 'critical',
    estimatedDuration: '~3 min (velocidad ×2)',
    events: [
      {
        atMs: 0,
        type: 'sismo',
        lat: 19.4326, lng: -99.1332,
        fields: { magnitud: 7.5, profundidad: 35, epicentroLat: 16.8, epicentroLng: -100.0 },
        zones: { red: 800, yellow: 2000, green: 4500 },
        sciZones: [
          // PC central de coordinación
          { type: 'pc',      lat: 19.4290, lng: -99.1280, label: 'PC-Central' },
          // Staging norte para ensamble de unidades
          { type: 'staging', lat: 19.4380, lng: -99.1290, label: 'Staging-N' },
        ],
        narrativeLog: [
          { level: 'critical', msg: 'ALERTA SÍSMICA — Sismo M7.5 detectado, epicentro Costa de Guerrero' },
          { level: 'info',     msg: 'CENACOM: Sacudida severa en CDMX, duración estimada 60 seg' },
          { level: 'info',     msg: 'CE-CDMX: Activando Protocolo de Respuesta Sísmica Nivel 3' },
          { level: 'info',     msg: 'Puesto de Comando central establecido — todas las dependencias reportar' },
        ],
      },
      {
        atMs: 8000,
        type: 'colapso',
        lat: 19.4180, lng: -99.1700,
        fields: { tipoEdificio: 'Habitacional', pisos: 5, atrapados: 12 },
        zones: { red: 100, yellow: 280, green: 650 },
        sciZones: [
          { type: 'acv',    lat: 19.4155, lng: -99.1670, label: 'ACV-S002' },
          { type: 'triage', lat: 19.4160, lng: -99.1725, label: 'Triage-S002' },
        ],
        narrativeLog: [
          { level: 'critical', msg: 'COLAPSO REPORTADO — Edificio habitacional 5 pisos, Col. Narvarte. 12 atrapados' },
          { level: 'info',     msg: 'ACV activada zona Narvarte — concentrando heridos' },
          { level: 'info',     msg: 'Zona de Triage operativa — clasificando víctimas' },
        ],
      },
      {
        atMs: 17000,
        type: 'colapso',
        lat: 19.3580, lng: -99.1620,
        fields: { tipoEdificio: 'Comercial', pisos: 8, atrapados: 22 },
        zones: { red: 150, yellow: 350, green: 800 },
        sciZones: [
          { type: 'acv',    lat: 19.3555, lng: -99.1595, label: 'ACV-S003' },
          { type: 'triage', lat: 19.3600, lng: -99.1600, label: 'Triage-S003' },
          { type: 'staging', lat: 19.3545, lng: -99.1650, label: 'Staging-S003' },
        ],
        narrativeLog: [
          { level: 'critical', msg: 'SEGUNDO COLAPSO — Edificio comercial 8 pisos, Del Valle. 22 posibles atrapados' },
          { level: 'info',     msg: 'Estructura completamente comprometida. Brigadas PC y ERUM despachadas' },
        ],
      },
      {
        atMs: 26000,
        type: 'incendio',
        lat: 19.4467, lng: -99.1129,
        fields: { descripcion: 'Incendio por ruptura de gas en zona de daño estructural', victimas: 4, notas: 'Riesgo de propagación a edificios contiguos' },
        zones: { red: 80, yellow: 220, green: 520 },
        narrativeLog: [
          { level: 'critical', msg: 'INCENDIO ACTIVO — Fuga de gas con colapso parcial, Col. Tepito. 4 heridos' },
          { level: 'info',     msg: 'Reportan llamas visibles en planta baja. Bomberos y Cruz Roja despachadas' },
        ],
      },
      {
        atMs: 36000,
        type: 'fugaQuimica',
        lat: 19.3960, lng: -99.0820,
        fields: { descripcion: 'Ruptura de tanque de amoniaco en planta industrial', victimas: 2, notas: 'Viento N-NE agrava dispersión' },
        zones: { red: 200, yellow: 600, green: 1400 },
        sciZones: [
          // Staging upwind (alejado del viento para seguridad de unidades)
          { type: 'staging',    lat: 19.4005, lng: -99.0870, label: 'Staging-HAZMAT' },
          // PC HAZMAT
          { type: 'pc',         lat: 19.4000, lng: -99.0780, label: 'PC-HAZMAT' },
        ],
        narrativeLog: [
          { level: 'critical', msg: 'FUGA QUÍMICA — Amoniaco industrial, Iztapalapa. Zona exclusión 200m' },
          { level: 'info',     msg: 'SEDENA y PC CDMX coordinando evacuación. Viento N-NE — staging upwind establecido' },
          { level: 'info',     msg: 'Área de Staging HAZMAT activada — unidades deben usar EPP nivel B' },
        ],
      },
      {
        atMs: 47000,
        type: 'colapso',
        lat: 19.4519, lng: -99.1383,
        fields: { tipoEdificio: 'Habitacional', pisos: 6, atrapados: 9 },
        zones: { red: 110, yellow: 260, green: 600 },
        sciZones: [
          { type: 'acv',       lat: 19.4497, lng: -99.1353, label: 'ACV-S006' },
          { type: 'helipuerto', lat: 19.4552, lng: -99.1363, label: 'Helipuerto-Tlatelolco' },
        ],
        narrativeLog: [
          { level: 'critical', msg: 'TERCER COLAPSO — Unidad habitacional Tlatelolco. 9 atrapados confirmados' },
          { level: 'info',     msg: 'Helipuerto activado — evacuación aérea de heridos críticos' },
          { level: 'info',     msg: 'RESUMEN: 6 incidentes activos · 49 víctimas · 18+ unidades en campo' },
        ],
      },
    ],
  },

  'incendio-tlatelolco': {
    key: 'incendio-tlatelolco',
    name: 'Incendio mayor — Tlatelolco',
    description: 'Incendio de gran magnitud en complejo habitacional. Propagación activa, múltiples llamadas simultáneas, evacuación masiva de residentes.',
    icon: '🔥',
    severity: 'high',
    estimatedDuration: '~2 min (velocidad ×2)',
    events: [
      {
        atMs: 0,
        type: 'incendio',
        lat: 19.4519, lng: -99.1383,
        fields: { descripcion: 'Incendio en edificio multifamiliar 12 niveles — posible fuga de gas en sótano', victimas: 15, notas: 'Edificio con 200+ habitantes. Escaleras bloqueadas por humo' },
        zones: { red: 130, yellow: 350, green: 750 },
        sciZones: [
          { type: 'pc',      lat: 19.4487, lng: -99.1343, label: 'PC-Incendio' },
          { type: 'staging', lat: 19.4558, lng: -99.1413, label: 'Staging-I001' },
          { type: 'acv',     lat: 19.4497, lng: -99.1420, label: 'ACV-I001' },
        ],
        narrativeLog: [
          { level: 'critical', msg: 'INCENDIO MAYOR — Edificio 12 pisos en Tlatelolco. 15 heridos, 200+ evacuando' },
          { level: 'info',     msg: 'Múltiples llamadas al 911. Llamas pisos 3-6. Escalera principal bloqueada' },
          { level: 'info',     msg: 'PC establecido. Staging para unidades. ACV activada zona sur' },
        ],
      },
      {
        atMs: 12000,
        type: 'incendio',
        lat: 19.4540, lng: -99.1395,
        fields: { descripcion: 'Propagación confirmada a edificio adyacente — fachada compartida', victimas: 6, notas: 'Vecinos atrapados en pisos 4 y 5' },
        zones: { red: 90, yellow: 230, green: 550 },
        sciZones: [
          { type: 'triage', lat: 19.4530, lng: -99.1375, label: 'Triage-I002' },
        ],
        narrativeLog: [
          { level: 'critical', msg: 'PROPAGACIÓN CONFIRMADA — Fuego alcanza edificio vecino. 6 heridos adicionales' },
          { level: 'info',     msg: 'Triage secundario activado — Cruz Roja clasificando nuevas víctimas' },
          { level: 'info',     msg: 'Solicitando 3 pipas adicionales. Acceso vial por Manuel González limitado' },
        ],
      },
      {
        atMs: 22000,
        type: 'vial',
        lat: 19.4528, lng: -99.1370,
        fields: { descripcion: 'Congestión severa bloquea acceso de vehículos de emergencia', victimas: 0, notas: 'SSC solicitada para abrir corredor de emergencia' },
        zones: { red: 40, yellow: 120, green: 300 },
        narrativeLog: [
          { level: 'critical', msg: 'ACCESO BLOQUEADO — Congestión corta vía principal. SSC abriendo corredor' },
          { level: 'info',     msg: 'Tiempo estimado acceso sin corredor: +8 min. Crítico para operación activa' },
        ],
      },
    ],
  },

  'colapso-puente': {
    key: 'colapso-puente',
    name: 'Colapso — Puente Periférico Oriente',
    description: 'Colapso parcial de tramo vehicular en Periférico. Vehículos sepultados, múltiples víctimas, riesgo de colapso secundario e incendio por derrame de combustible.',
    icon: '🌉',
    severity: 'high',
    estimatedDuration: '~1.5 min (velocidad ×2)',
    events: [
      {
        atMs: 0,
        type: 'colapso',
        lat: 19.3820, lng: -99.0540,
        fields: { tipoEdificio: 'Mixto', pisos: 2, atrapados: 8 },
        zones: { red: 120, yellow: 300, green: 700 },
        sciZones: [
          { type: 'pc',      lat: 19.3788, lng: -99.0510, label: 'PC-Puente' },
          { type: 'acv',     lat: 19.3852, lng: -99.0558, label: 'ACV-P001' },
          { type: 'triage',  lat: 19.3798, lng: -99.0572, label: 'Triage-P001' },
          { type: 'staging', lat: 19.3840, lng: -99.0500, label: 'Staging-P001' },
        ],
        narrativeLog: [
          { level: 'critical', msg: 'COLAPSO ESTRUCTURAL — Tramo de puente en Periférico Oriente. 8 atrapados bajo escombros' },
          { level: 'info',     msg: 'Ingeniería: riesgo de colapso secundario en sección adyacente — zona roja ampliada' },
          { level: 'info',     msg: 'PC establecido. ACV + Triage activos. Cerrando Periférico km 18-22' },
        ],
      },
      {
        atMs: 9000,
        type: 'vial',
        lat: 19.3826, lng: -99.0548,
        fields: { descripcion: '14 vehículos en colisión en cascada. Peligro incendio por derrame combustible', victimas: 22, notas: 'Al menos 3 vehículos pesados. Cruz Roja solicitando apoyo' },
        zones: { red: 70, yellow: 200, green: 500 },
        narrativeLog: [
          { level: 'critical', msg: 'ACCIDENTE MASIVO — 14 vehículos, 22 heridos. Riesgo de incendio por derrame' },
          { level: 'info',     msg: 'Cruz Roja y ERUM: Triage activado. Víctimas críticas a ACV para estabilización' },
        ],
      },
      {
        atMs: 18000,
        type: 'incendio',
        lat: 19.3815, lng: -99.0535,
        fields: { descripcion: 'Combustible derramado se incendia — riesgo de propagación a cisternas', victimas: 1, notas: 'Viento sur agrava la situación' },
        zones: { red: 60, yellow: 180, green: 450 },
        sciZones: [
          { type: 'helipuerto', lat: 19.3855, lng: -99.0505, label: 'Helipuerto-P003' },
        ],
        narrativeLog: [
          { level: 'critical', msg: 'INCENDIO DERIVADO — Combustible en llamas. Riesgo cisterna. Evacuando zona verde' },
          { level: 'info',     msg: 'Helipuerto activado — evacuación aérea de heridos críticos en ACV' },
          { level: 'info',     msg: 'Bomberos redirigidos a contener incendio. Rescate continúa en sector norte' },
        ],
      },
    ],
  },
}

export const AUTO_SCENARIO_KEYS = Object.keys(SCI_AUTO_SCENARIOS)
