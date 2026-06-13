import { getColoniaCentroid, findNearest, countWithinRadius } from './geo.js'

/**
 * Compute gap scores for all colonias.
 *
 * Returns a Map<cveGeo, { score, nearestHospitalKm, nearestFireStationKm, label }>
 *
 * Score formula:
 *   gapScore = (demandNormalized - supplyNormalized) * 100
 *
 *   demand = incidentsPerCapita (filtered by active types), normalized to [0,1]
 *   supply = 0.5 * hospitalProximity + 0.3 * fireProximity + 0.2 * densityScore
 *            each component normalized to [0,1]
 *
 *   Interpretation:
 *     < 0   → excellent (over-served)
 *     0–20  → good
 *     20–50 → moderate gap
 *     ≥ 50  → critical gap
 */
export function computeGapScores({
  colonias,        // GeoJSON FeatureCollection
  incidents,       // { data: { [cveGeo]: { byType, total } }, ... }
  hospitals,       // [{ lat, lng, ... }]
  fireStations,    // [{ lat, lng, ... }]
  activeTypes,     // ['medical', 'fire', 'traffic', 'security']
  hypothetical = [], // [{ type, lat, lng }] — simulator additions
}) {
  if (!colonias || !incidents?.data) return new Map()

  const allHospitals = [...hospitals, ...hypothetical.filter(h => h.type === 'hospital')]
  const allFireStations = [...fireStations, ...hypothetical.filter(h => h.type === 'fireStation')]

  // Step 1 — collect raw demand values
  const rawDemands = {}
  for (const feature of colonias.features) {
    const cve = feature.properties.CVE_GEO
    const inc = incidents.data[cve]
    const pop = feature.properties.population || 1

    let incidentCount = 0
    if (inc) {
      for (const type of activeTypes) {
        incidentCount += inc.byType?.[type] || 0
      }
    }

    rawDemands[cve] = incidentCount / (pop / 10000) // per 10k inhabitants
  }

  const maxDemand = Math.max(...Object.values(rawDemands), 1)

  // Step 2 — collect raw supply values
  const rawSupply = {}
  const centroids = {}

  for (const feature of colonias.features) {
    const cve = feature.properties.CVE_GEO
    const coord = getColoniaCentroid(feature) // [lng, lat]
    centroids[cve] = coord

    const nearestH = findNearest(coord, allHospitals)
    const nearestF = findNearest(coord, allFireStations)

    const hDist = nearestH?.distanceKm ?? 99
    const fDist = nearestF?.distanceKm ?? 99

    const hProximity = 1 / (hDist + 0.5)
    const fProximity = 1 / (fDist + 0.5)
    const density = countWithinRadius(coord, allHospitals, 3) // hospitals within 3km

    rawSupply[cve] = {
      hProximity,
      fProximity,
      density,
      nearestHospitalKm: hDist,
      nearestFireStationKm: fDist,
    }
  }

  const maxHProximity = Math.max(...Object.values(rawSupply).map(s => s.hProximity), 1)
  const maxFProximity = Math.max(...Object.values(rawSupply).map(s => s.fProximity), 1)
  const maxDensity = Math.max(...Object.values(rawSupply).map(s => s.density), 1)

  // Step 3 — compute final scores
  const scores = new Map()

  for (const feature of colonias.features) {
    const cve = feature.properties.CVE_GEO
    const inc = incidents.data[cve]

    if (!inc) {
      scores.set(cve, { score: null, nearestHospitalKm: null, nearestFireStationKm: null })
      continue
    }

    const demandNorm = rawDemands[cve] / maxDemand

    const s = rawSupply[cve]
    const supplyNorm =
      0.5 * (s.hProximity / maxHProximity) +
      0.3 * (s.fProximity / maxFProximity) +
      0.2 * (s.density / maxDensity)

    const score = (demandNorm - supplyNorm) * 100

    scores.set(cve, {
      score: Math.round(score),
      nearestHospitalKm: Math.round(s.nearestHospitalKm * 10) / 10,
      nearestFireStationKm: Math.round(s.nearestFireStationKm * 10) / 10,
    })
  }

  return scores
}

/**
 * Summarize a score map into aggregate stats.
 */
export function summarizeScores(scoreMap) {
  let critical = 0, moderate = 0, good = 0, excellent = 0, noData = 0
  let totalScore = 0
  let count = 0

  for (const { score } of scoreMap.values()) {
    if (score === null) { noData++; continue }
    count++
    totalScore += score
    if (score >= 50) critical++
    else if (score >= 20) moderate++
    else if (score >= 0) good++
    else excellent++
  }

  return {
    critical,
    moderate,
    good,
    excellent,
    noData,
    total: scoreMap.size,
    avgScore: count > 0 ? Math.round(totalScore / count) : null,
  }
}
