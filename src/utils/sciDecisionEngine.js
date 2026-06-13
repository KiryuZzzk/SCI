/**
 * Motor de decisión SCI — recomendación de despacho por matriz de costos.
 *
 * No es ML. Es operations research clásico (resource ordering ICS):
 * cada unidad disponible recibe un score compuesto para un incidente dado,
 * combinando idoneidad de capacidad, ETA real, nivel NIMS y match de
 * dependencia. Luego rankea y arma un "paquete de respuesta" cubriendo
 * las capacidades requeridas (greedy set-cover ponderado).
 */

import { calcEtaMs } from './etaModel.js'
import { unitCaps, incidentNeeds } from '../constants/sciCapabilityMatrix.js'
import { NIMS_TYPE } from '../constants/nimsResourceTyping.js'
import { SCI_INCIDENT_TYPES } from '../constants/sciIncidentTypes.js'

// Pesos del score compuesto (suman 1.0)
const W = {
  capability: 0.50,
  eta:        0.30,
  nims:       0.12,
  depMatch:   0.08,
}

const ETA_MAX_MS = 15 * 60 * 1000  // 15 min → score ETA = 0
const NIMS_SCORE = { I: 1.0, II: 0.8, III: 0.55, IV: 0.3 }

/**
 * Score de cobertura de capacidad: fracción ponderada de las necesidades
 * del incidente que la unidad satisface.
 * @returns {{ score:number, matched:string[] }}
 */
function capabilityScore(unitTypeCode, needs) {
  const caps = unitCaps(unitTypeCode)
  const needKeys = Object.keys(needs)
  if (needKeys.length === 0) return { score: 0.5, matched: [] }
  const totalWeight = needKeys.reduce((s, k) => s + needs[k], 0)
  let covered = 0
  const matched = []
  for (const cap of caps) {
    if (needs[cap]) { covered += needs[cap]; matched.push(cap) }
  }
  return { score: totalWeight > 0 ? covered / totalWeight : 0, matched }
}

function etaScore(etaMs) {
  return Math.max(0, 1 - etaMs / ETA_MAX_MS)
}

/**
 * Puntúa UNA unidad para UN incidente.
 * @returns objeto con score [0-100] y desglose.
 */
export function scoreUnit(unit, incident, nowMs = Date.now()) {
  const needs = incidentNeeds(incident.type)
  const { score: capScore, matched } = capabilityScore(unit.typeCode, needs)

  const eta = calcEtaMs({
    originLat: unit.lat, originLng: unit.lng,
    destLat: incident.lat, destLng: incident.lng,
    typeCode: unit.typeCode, emergency: true, nowMs,
  })
  const etaSc = etaScore(eta)

  const nimsSc = NIMS_SCORE[NIMS_TYPE[unit.typeCode]] ?? 0.4

  const typeDef = SCI_INCIDENT_TYPES[incident.type] ?? {}
  const depMatch = (typeDef.requiredResponders ?? []).includes(unit.dependency) ? 1 : 0

  const composite =
    W.capability * capScore +
    W.eta        * etaSc +
    W.nims       * nimsSc +
    W.depMatch   * depMatch

  return {
    resourceId: unit.id,
    resource: unit,
    score: Math.round(composite * 100),
    eta,
    matched,
    breakdown: {
      capability: Math.round(capScore * 100),
      eta:        Math.round(etaSc * 100),
      nims:       Math.round(nimsSc * 100),
      depMatch,
    },
  }
}

/**
 * Rankea todas las unidades disponibles para un incidente.
 * @param {Array} units — recursos (deben tener lat/lng/typeCode/dependency)
 * @returns lista ordenada desc por score (solo capability > 0 o depMatch)
 */
export function rankUnits(incident, units, nowMs = Date.now()) {
  if (!incident) return []
  return units
    .map(u => scoreUnit(u, incident, nowMs))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * Arma un paquete de respuesta cubriendo las capacidades CRÍTICAS e
 * IMPORTANTES del incidente (peso ≥ 2). Greedy: por cada necesidad sin
 * cubrir, toma la mejor unidad que la aporte y no esté ya en el paquete.
 *
 * @returns {{ package: Array<scoreUnit>, covered:string[], uncovered:string[] }}
 */
export function recommendPackage(incident, units, nowMs = Date.now()) {
  if (!incident) return { package: [], covered: [], uncovered: [] }
  const needs = incidentNeeds(incident.type)
  // Necesidades prioritarias (peso ≥ 2), ordenadas por peso desc
  const priorityNeeds = Object.keys(needs)
    .filter(k => needs[k] >= 2)
    .sort((a, b) => needs[b] - needs[a])

  const ranked = rankUnits(incident, units, nowMs)
  const chosen = []
  const chosenIds = new Set()
  const covered = new Set()

  for (const need of priorityNeeds) {
    if (covered.has(need)) continue
    // Mejor unidad (ya rankeada) que aporte esta capacidad y no esté elegida
    const cand = ranked.find(s => !chosenIds.has(s.resourceId) && s.matched.includes(need))
    if (cand) {
      chosen.push(cand)
      chosenIds.add(cand.resourceId)
      // marca todas las caps que esta unidad cubre
      cand.matched.forEach(c => covered.add(c))
    }
  }

  const uncovered = priorityNeeds.filter(n => !covered.has(n))
  return {
    package: chosen,
    covered: [...covered],
    uncovered,
  }
}
