/**
 * Matriz de capacidades SCI — base del motor de decisión.
 *
 *  UNIT_CAPABILITIES: qué sabe hacer cada typeCode de unidad.
 *  INCIDENT_NEEDS:    qué capacidades requiere cada tipo de incidente,
 *                     con peso (1 = deseable, 2 = importante, 3 = crítico).
 *
 * Las capacidades son un vocabulario controlado compartido. El motor
 * cruza ambos para puntuar idoneidad unidad↔incidente.
 */

// ── Vocabulario de capacidades ──────────────────────────────────────
export const CAP = {
  FIRE:        'supresión-incendio',
  RESCUE:      'rescate-técnico',
  EXTRICATION: 'extracción-vehicular',
  USAR:        'búsqueda-rescate-urbano',
  MEDICAL_BLS: 'soporte-vital-básico',
  MEDICAL_ALS: 'soporte-vital-avanzado',
  TRIAGE:      'triage-masivo',
  HAZMAT:      'materiales-peligrosos',
  SECURITY:    'seguridad-perímetro',
  K9:          'binomio-canino',
  WATER:       'logística-agua',
  HEAVY:       'maquinaria-pesada',
  AIR:         'apoyo-aéreo',
  EVAL:        'evaluación-estructural',
  AQUATIC:     'rescate-acuático',
  HOSPITAL:    'recepción-hospitalaria',
  COMMAND:     'mando-coordinación',
}

// ── Capacidades por tipo de unidad ──────────────────────────────────
export const UNIT_CAPABILITIES = {
  'ambulancia-basica':    [CAP.MEDICAL_BLS],
  'ambulancia-intensiva': [CAP.MEDICAL_ALS, CAP.MEDICAL_BLS],
  'cruzroja-basica':      [CAP.MEDICAL_BLS],
  'cruzroja-intensiva':   [CAP.MEDICAL_ALS, CAP.MEDICAL_BLS],
  'rescate-erum':         [CAP.RESCUE, CAP.EXTRICATION, CAP.MEDICAL_BLS],
  'rescate-bomberos':     [CAP.FIRE, CAP.RESCUE, CAP.EXTRICATION],
  'pipa-bomberos':        [CAP.FIRE, CAP.WATER],
  'patrulla-ssc':         [CAP.SECURITY],
  'k9-ssc':               [CAP.K9, CAP.USAR, CAP.SECURITY],
  'pc-busqueda-rescate':  [CAP.USAR, CAP.RESCUE, CAP.K9],
  'pc-evaluacion':        [CAP.EVAL, CAP.COMMAND],
  'convoy-sedena':        [CAP.SECURITY, CAP.HEAVY, CAP.COMMAND],
  'ingenieros-sedena':    [CAP.HEAVY, CAP.USAR, CAP.EVAL],
  'marina-refuerzo':      [CAP.AQUATIC, CAP.RESCUE, CAP.SECURITY],
  'helicoptero-condor':   [CAP.AIR, CAP.MEDICAL_ALS],
  'helicoptero-marina':   [CAP.AIR, CAP.AQUATIC, CAP.RESCUE],
  'hospital-3er-nivel':   [CAP.HOSPITAL],
  'hospital-2do-nivel':   [CAP.HOSPITAL],
  'hospital-1er-nivel':   [CAP.HOSPITAL],
  'acv-fijo':             [CAP.TRIAGE, CAP.MEDICAL_BLS],
  'acv-avanzado':         [CAP.TRIAGE, CAP.MEDICAL_ALS],
}

// ── Necesidades por tipo de incidente (capacidad → peso) ────────────
// peso: 3 crítico · 2 importante · 1 deseable
export const INCIDENT_NEEDS = {
  sismo: {
    [CAP.USAR]: 3, [CAP.RESCUE]: 3, [CAP.MEDICAL_ALS]: 2, [CAP.TRIAGE]: 2,
    [CAP.HEAVY]: 2, [CAP.EVAL]: 2, [CAP.K9]: 2, [CAP.COMMAND]: 1, [CAP.AIR]: 1,
  },
  colapso: {
    [CAP.USAR]: 3, [CAP.RESCUE]: 3, [CAP.HEAVY]: 2, [CAP.MEDICAL_ALS]: 2,
    [CAP.K9]: 2, [CAP.EVAL]: 1,
  },
  incendio: {
    [CAP.FIRE]: 3, [CAP.WATER]: 2, [CAP.RESCUE]: 2, [CAP.MEDICAL_BLS]: 1,
  },
  vial: {
    [CAP.EXTRICATION]: 3, [CAP.MEDICAL_ALS]: 2, [CAP.MEDICAL_BLS]: 2, [CAP.SECURITY]: 1,
  },
  hazmat: {
    [CAP.HAZMAT]: 3, [CAP.FIRE]: 2, [CAP.SECURITY]: 2, [CAP.EVAL]: 1, [CAP.MEDICAL_ALS]: 1,
  },
  inundacion: {
    [CAP.AQUATIC]: 3, [CAP.RESCUE]: 2, [CAP.HEAVY]: 1, [CAP.MEDICAL_BLS]: 1,
  },
  explosion: {
    [CAP.FIRE]: 3, [CAP.RESCUE]: 3, [CAP.MEDICAL_ALS]: 2, [CAP.TRIAGE]: 2, [CAP.SECURITY]: 1,
  },
  fugaQuimica: {
    [CAP.HAZMAT]: 3, [CAP.FIRE]: 2, [CAP.SECURITY]: 1, [CAP.MEDICAL_BLS]: 1,
  },
  seguridad: {
    [CAP.SECURITY]: 3, [CAP.K9]: 1,
  },
  tsunami: {
    [CAP.AQUATIC]: 3, [CAP.RESCUE]: 3, [CAP.AIR]: 2, [CAP.TRIAGE]: 2, [CAP.MEDICAL_ALS]: 2,
  },
  fallaElectrica: {
    [CAP.SECURITY]: 2, [CAP.EVAL]: 1, [CAP.COMMAND]: 1,
  },
  hundimiento: {
    [CAP.RESCUE]: 3, [CAP.HEAVY]: 2, [CAP.EVAL]: 2, [CAP.EXTRICATION]: 1,
  },
  inundacionPluvial: {
    [CAP.AQUATIC]: 3, [CAP.RESCUE]: 2, [CAP.SECURITY]: 1,
  },
  disturbio: {
    [CAP.SECURITY]: 3, [CAP.MEDICAL_BLS]: 1,
  },
}

// Etiquetas cortas para badges UI
export const CAP_LABEL = {
  [CAP.FIRE]:        'Incendio',
  [CAP.RESCUE]:      'Rescate',
  [CAP.EXTRICATION]: 'Extracción',
  [CAP.USAR]:        'USAR',
  [CAP.MEDICAL_BLS]: 'SVB',
  [CAP.MEDICAL_ALS]: 'SVA',
  [CAP.TRIAGE]:      'Triage',
  [CAP.HAZMAT]:      'HAZMAT',
  [CAP.SECURITY]:    'Seguridad',
  [CAP.K9]:          'K9',
  [CAP.WATER]:       'Agua',
  [CAP.HEAVY]:       'Maquinaria',
  [CAP.AIR]:         'Aéreo',
  [CAP.EVAL]:        'Evaluación',
  [CAP.AQUATIC]:     'Acuático',
  [CAP.HOSPITAL]:    'Hospital',
  [CAP.COMMAND]:     'Mando',
}

export const capLabel = (cap) => CAP_LABEL[cap] ?? cap
export const unitCaps = (typeCode) => UNIT_CAPABILITIES[typeCode] ?? []
export const incidentNeeds = (type) => INCIDENT_NEEDS[type] ?? {}
