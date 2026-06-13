/**
 * Checklist SCI/ICS — secuencia oficial de acciones del primer respondiente
 * y del Comandante de Incidente (IC), basada en el flujo NIMS/ICS y el
 * formato ICS-201.
 *
 * Cada paso:
 *   key         — id estable
 *   label       — acción
 *   hint        — detalle/criterio
 *   phase       — agrupación (size-up, mando, recursos, operaciones, docs, cierre)
 *   notePrompt  — si presente, muestra textarea para documentar
 *   auto        — función (incident, sci) → boolean | undefined
 *                 true: sistema detecta cumplimiento (se bloquea)
 *                 false/undefined: manualmente verificable
 */

export const CHECKLIST_PHASES = [
  { key: 'sizeup',     label: 'Evaluación inicial',       color: '#38bdf8' },
  { key: 'mando',      label: 'Establecimiento de mando', color: '#a78bfa' },
  { key: 'recursos',   label: 'Recursos',                 color: '#fb923c' },
  { key: 'operaciones',label: 'Operaciones',              color: '#f59e0b' },
  { key: 'docs',       label: 'Documentación',            color: '#22c55e' },
  { key: 'cierre',     label: 'Desmovilización y cierre', color: '#94a3b8' },
]

// Helpers de detección
const hasUnitsAssigned = (inc) => (inc.assignedUnitIds?.length ?? 0) > 0
const hasUnitOnScene = (inc, sci) =>
  (inc.assignedUnitIds ?? []).some(id => {
    const r = sci.resources.byId[id]
    return r && (r.state === 'on-scene' || r.state === 'enroute')
  })
const victimsCount = (inc) => {
  const v = inc.fields?.victimas ?? inc.fields?.atrapados ?? inc.fields?.personasEst ?? 0
  return Number(v) || 0
}
const hasAcvAssigned = (inc, sci) =>
  (inc.assignedUnitIds ?? []).some(id => {
    const r = sci.resources.byId[id]
    return r && (r.typeCode === 'acv-fijo' || r.typeCode === 'acv-avanzado')
  })

export const CHECKLIST_STEPS = [
  // ── Evaluación inicial ──
  {
    key: 'confirm-type', phase: 'sizeup',
    label: 'Confirmar tipo y magnitud',
    hint: 'Identificar naturaleza del incidente y alcance inicial',
    auto: (inc) => !!inc.type,
  },
  {
    key: 'set-perimeter', phase: 'sizeup',
    label: 'Establecer perímetro y zonas',
    hint: 'Definir zona caliente / tibia / fría (rojo/amarillo/verde)',
    auto: (inc) => !!inc.zones && inc.zones.red > 0,
  },
  {
    key: 'identify-hazards', phase: 'sizeup',
    label: 'Identificar riesgos secundarios',
    hint: 'Fugas, colapsos, líneas vivas, materiales peligrosos',
    notePrompt: 'Describe los riesgos identificados (fugas, colapso, líneas vivas...)',
    auto: undefined,
  },

  // ── Establecimiento de mando ──
  {
    key: 'assume-command', phase: 'mando',
    label: 'Asumir el mando (IC)',
    hint: 'Designar Comandante de Incidente',
    auto: (inc, sci) => !!sci.command?.IC,
  },
  {
    key: 'establish-pc', phase: 'mando',
    label: 'Establecer Puesto de Comando',
    hint: 'Ubicación segura y visible en zona fría',
    notePrompt: 'Describe la ubicación del Puesto de Comando',
    auto: (inc, sci) => !!(sci.zones?.some(
      z => z.type === 'pc' && (!z.incidentId || z.incidentId === inc.id)
    )),
  },
  {
    key: 'open-op', phase: 'mando',
    label: 'Iniciar período operacional',
    hint: 'Abrir OP y definir objetivos del período',
    auto: (inc, sci) => !!sci.activeOpId,
  },

  // ── Recursos ──
  {
    key: 'request-resources', phase: 'recursos',
    label: 'Solicitar recursos iniciales',
    hint: 'Despachar unidades según tipo y magnitud del incidente',
    auto: (inc) => hasUnitsAssigned(inc),
  },
  {
    key: 'confirm-arrival', phase: 'recursos',
    label: 'Confirmar arribo de unidades',
    hint: 'Primeras unidades en tránsito o en escena',
    auto: (inc, sci) => hasUnitOnScene(inc, sci),
  },
  {
    key: 'command-staff', phase: 'recursos',
    label: 'Designar Staff de Mando',
    hint: 'Seguridad (SO), Información (PIO), Enlace (LO) si el incidente escala',
    notePrompt: 'Nombre y función: SO / PIO / LO designados',
    auto: (inc, sci) => !!(sci.command?.SO || sci.command?.PIO || sci.command?.LO),
  },

  // ── Operaciones ──
  {
    key: 'triage-acv', phase: 'operaciones',
    label: 'Establecer triage / ACV',
    hint: 'Si hay víctimas múltiples: montar Área de Concentración de Víctimas',
    notePrompt: 'Ubicación ACV, capacidad estimada, responsable asignado',
    auto: (inc, sci) => victimsCount(inc) >= 5 ? hasAcvAssigned(inc, sci) : undefined,
    conditional: (inc) => victimsCount(inc) >= 5,
  },
  {
    key: 'comms-plan', phase: 'operaciones',
    label: 'Establecer plan de comunicaciones',
    hint: 'Canal común interoperable entre dependencias',
    notePrompt: 'Canal/frecuencia asignada para el incidente',
    auto: undefined,
  },
  {
    key: 'general-staff', phase: 'operaciones',
    label: 'Activar Staff General',
    hint: 'Operaciones, Planeación, Logística, Finanzas si el incidente es complejo',
    notePrompt: 'OSC / PSC / LSC / FSC — nombre y organización',
    auto: (inc, sci) => !!(sci.command?.OSC || sci.command?.PSC || sci.command?.LSC || sci.command?.FSC),
  },

  // ── Documentación ──
  {
    key: 'log-214', phase: 'docs',
    label: 'Iniciar bitácora (ICS-214)',
    hint: 'Registro continuo de actividades del incidente',
    auto: (inc) => (inc.log?.length ?? 0) > 1,
  },
  {
    key: 'briefing-201', phase: 'docs',
    label: 'Generar briefing (ICS-201)',
    hint: 'Documento de transferencia de mando — situación actual',
    notePrompt: 'Notas clave para la transferencia de mando',
    auto: undefined,
  },

  // ── Desmovilización y cierre ──
  {
    key: 'demob', phase: 'cierre',
    label: 'Iniciar desmovilización',
    hint: 'Liberar recursos no requeridos progresivamente',
    notePrompt: 'Recursos liberados y dependencia de destino',
    auto: undefined,
  },
  {
    key: 'close-incident', phase: 'cierre',
    label: 'Cerrar incidente',
    hint: 'Confirmar control total y cierre formal del incidente',
    auto: (inc) => inc.status === 'closed',
  },
  {
    key: 'aar', phase: 'cierre',
    label: 'Generar After-Action Report',
    hint: 'Análisis post-evento y lecciones aprendidas',
    notePrompt: 'Lecciones aprendidas y recomendaciones para futuros incidentes',
    auto: undefined,
  },
]
