/**
 * Generates a street-like route between two points in CDMX.
 *
 * Instead of a straight line, produces 2-4 waypoints that simulate
 * turning at city block intersections (mostly axis-aligned movement).
 *
 * Returns an array of [lat, lng] waypoints ending at [toLat, toLng].
 */

// Major CDMX arterial "snap" lines (simplified grid nodes)
// These are real major intersections used as optional routing pivots
const ARTERIALS_LAT = [
  19.550, 19.520, 19.490, 19.470, 19.450, 19.430,
  19.415, 19.400, 19.385, 19.370, 19.355, 19.340,
  19.325, 19.310, 19.295, 19.270, 19.245, 19.200,
]
const ARTERIALS_LNG = [
  -99.330, -99.290, -99.265, -99.240, -99.215, -99.195,
  -99.175, -99.158, -99.140, -99.125, -99.110, -99.095,
  -99.080, -99.065, -99.050, -99.030,
]

function snapToGrid(lat, lng, jitter = 0.004) {
  const nearLat = ARTERIALS_LAT.reduce((a, b) =>
    Math.abs(a - lat) < Math.abs(b - lat) ? a : b)
  const nearLng = ARTERIALS_LNG.reduce((a, b) =>
    Math.abs(a - lng) < Math.abs(b - lng) ? a : b)
  // Add small jitter so multiple units don't overlap exactly
  return [
    nearLat + (Math.random() - 0.5) * jitter,
    nearLng + (Math.random() - 0.5) * jitter,
  ]
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

export function streetRoute(fromLat, fromLng, toLat, toLng) {
  const waypoints = []
  const dLat = toLat - fromLat
  const dLng = toLng - fromLng
  const dist  = Math.sqrt(dLat * dLat + dLng * dLng)

  if (dist < 0.008) {
    // Very close — just go direct
    return [[toLat, toLng]]
  }

  // Pick a "corner" on a nearby arterial
  const goHorizFirst = Math.random() < 0.5

  if (goHorizFirst) {
    // Move along longitude first, then latitude
    const [pivotLat, pivotLng] = snapToGrid(fromLat, toLng)
    waypoints.push([
      clamp(pivotLat, Math.min(fromLat, toLat) - 0.01, Math.max(fromLat, toLat) + 0.01),
      clamp(pivotLng, Math.min(fromLng, toLng) - 0.005, Math.max(fromLng, toLng) + 0.005),
    ])
  } else {
    // Move along latitude first, then longitude
    const [pivotLat, pivotLng] = snapToGrid(toLat, fromLng)
    waypoints.push([
      clamp(pivotLat, Math.min(fromLat, toLat) - 0.01, Math.max(fromLat, toLat) + 0.01),
      clamp(pivotLng, Math.min(fromLng, toLng) - 0.005, Math.max(fromLng, toLng) + 0.005),
    ])
  }

  // For longer routes, add a second intermediate waypoint
  if (dist > 0.05) {
    const t = 0.55 + (Math.random() - 0.5) * 0.15
    const [p2Lat, p2Lng] = snapToGrid(
      fromLat + dLat * t,
      fromLng + dLng * t,
      0.003,
    )
    waypoints.push([p2Lat, p2Lng])
  }

  waypoints.push([toLat, toLng])
  return waypoints
}
