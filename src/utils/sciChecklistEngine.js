/**
 * Motor del checklist SCI — combina auto-detección con toggles manuales.
 *
 * Reglas de fuente:
 *   - auto(inc,sci) === true  → done=true,  source='auto'   (bloqueado, sistema lo confirma)
 *   - auto(inc,sci) === false → done=manual, source='manual' (usuario puede marcar)
 *   - auto === undefined      → done=manual, source='manual'
 */

import { CHECKLIST_STEPS, CHECKLIST_PHASES } from '../constants/sciChecklist.js'

/**
 * @returns lista de pasos resueltos con { ...step, done, source, applicable, note }
 *   source: 'auto' | 'manual'
 */
export function resolveChecklist(incident, sci) {
  if (!incident) return []
  const manual = sci.checklists?.[incident.id] ?? {}

  return CHECKLIST_STEPS.map(step => {
    // Condicional que no aplica → N/A
    const applicable = step.conditional ? step.conditional(incident) : true

    let done = false
    let source = 'manual'

    if (applicable && typeof step.auto === 'function') {
      const autoResult = step.auto(incident, sci)
      if (autoResult === true) {
        // Sistema confirma: bloqueado, no editable
        done = true
        source = 'auto'
      } else {
        // auto=false o undefined → siempre manual (usuario puede marcar)
        done = manual[step.key]?.done ?? false
        source = 'manual'
      }
    } else {
      done = manual[step.key]?.done ?? false
      source = 'manual'
    }

    const note = manual[step.key]?.note ?? ''

    return { ...step, done, source, applicable, note }
  })
}

/**
 * Resumen de progreso (ignora pasos N/A).
 * @returns { total, done, pct, byPhase }
 */
export function checklistProgress(resolved) {
  const applicable = resolved.filter(s => s.applicable)
  const done = applicable.filter(s => s.done).length
  const total = applicable.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const byPhase = {}
  for (const phase of CHECKLIST_PHASES) {
    const steps = applicable.filter(s => s.phase === phase.key)
    byPhase[phase.key] = {
      done: steps.filter(s => s.done).length,
      total: steps.length,
    }
  }
  return { total, done, pct, byPhase }
}

/** Siguiente acción pendiente (primer paso aplicable no hecho). */
export function nextPendingStep(resolved) {
  return resolved.find(s => s.applicable && !s.done) ?? null
}
