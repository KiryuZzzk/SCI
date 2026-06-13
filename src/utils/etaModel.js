/**
 * Modelo de ETA realista para CDMX
 *
 * Factores:
 *   1. Velocidad base por tipo de unidad (km/h)
 *   2. Factor de tortuosidad de vialidades CDMX (~1.35 vs. línea recta)
 *   3. Factor hora-pico (lunes-viernes 07-10h, 14-16h, 18-21h)
 *   4. Varianza aleatoria ±10% para simular tráfico
 *
 * Retorna ETA en **milisegundos**.
 */

// Velocidades promedio de desplazamiento por tipo de recurso (km/h en condiciones normales)
const BASE_SPEED_KMPH = {
  // Ambulancias
  ALS: 55, BLS: 50, MOTO_MED: 65,
  // Bomberos
  AUTOESCALA: 45, AECP: 45, BAPCE: 48, BAP: 48, VHBE: 50, CARRO_RESCATE: 50,
  // Policía
  MOTO_POL: 70, PATRULLA: 65, JEEP: 60, GRUPO_TAC: 55,
  // Protección Civil
  PC_COORD: 60, CARRO_PC: 55, UNIDAD_BUSQUEDA: 50,
  // Cruz Roja
  AMB_CRUZ_ROJA: 55, UNIDAD_CR: 55,
  // SEDENA / Marina
  CAMION_SEDENA: 55, HELICOPTERO: 180, VEHICULO_ANFIX: 50,
  // Hospitales
  MEDICO_CRUM: 60,
  // Default
  DEFAULT: 50,
}

/**
 * Factor de tortuosidad vial CDMX.
 * Línea recta → distancia real. Calibrado con mediciones de OSM en CDMX.
 * Colonias densas (centro histórico, tepito) ~1.45; periférico ~1.15.
 * Usamos 1.35 como promedio metro-CDMX.
 */
const TORTUOSITY = 1.35

/**
 * Hora pico CDMX (hora local México):
 *   - Matutino:  07:00–10:00 → ×2.1
 *   - Vespertino: 14:00–16:00 → ×1.5
 *   - Nocturno:  18:00–21:00 → ×1.9
 *   - Madrugada: 23:00–05:00 → ×0.7
 *   - Resto:     ×1.0
 */
function rushFactor(nowMs = Date.now()) {
  const tz  = 'America/Mexico_City'
  const hr  = new Date(nowMs).toLocaleString('es-MX', { timeZone: tz, hour: 'numeric', hour12: false })
  const h   = parseInt(hr, 10)
  const dow = new Date(nowMs).toLocaleString('es-MX', { timeZone: tz, weekday: 'short' })
  const isWeekday = !['sáb', 'dom'].includes(dow)

  if (!isWeekday) return 0.85  // fin de semana, menos tráfico

  if (h >= 7  && h < 10)  return 2.1   // pico matutino
  if (h >= 14 && h < 16)  return 1.5   // pico comida
  if (h >= 18 && h < 21)  return 1.9   // pico nocturno
  if (h >= 23 || h < 5)   return 0.7   // madrugada
  return 1.0
}

/**
 * Calcula distancia Haversine en kilómetros.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R  = 6371
  const d1 = (lat2 - lat1) * Math.PI / 180
  const d2 = (lng2 - lng1) * Math.PI / 180
  const a  = Math.sin(d1/2) ** 2 +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(d2/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Calcula ETA realista en milisegundos.
 *
 * @param {object} params
 * @param {number} params.originLat
 * @param {number} params.originLng
 * @param {number} params.destLat
 * @param {number} params.destLng
 * @param {string} [params.typeCode]     — código de tipo de unidad (e.g. 'ALS')
 * @param {boolean} [params.emergency]  — si true: aplica factor emergencia ×0.7 sobre hora pico
 * @param {number}  [params.nowMs]      — timestamp de referencia (default Date.now())
 * @returns {number} ETA en milisegundos
 */
export function calcEtaMs({
  originLat, originLng,
  destLat,   destLng,
  typeCode   = 'DEFAULT',
  emergency  = true,
  nowMs      = Date.now(),
}) {
  const distKm   = haversineKm(originLat, originLng, destLat, destLng)
  const roadKm   = distKm * TORTUOSITY
  const baseKmph = BASE_SPEED_KMPH[typeCode] ?? BASE_SPEED_KMPH.DEFAULT

  let congestion = rushFactor(nowMs)
  if (emergency) congestion = Math.max(1.0, congestion * 0.7)  // sirenas reducen efecto

  const effectiveKmph = baseKmph / congestion
  const hours         = roadKm / effectiveKmph

  // ±10% varianza aleatoria (ruido de tráfico)
  const jitter = 0.9 + Math.random() * 0.2
  const ms     = hours * 3_600_000 * jitter

  // Mínimo 15 s, máximo 45 min
  return Math.min(Math.max(ms, 15_000), 2_700_000)
}

/**
 * ETA formateada para UI.
 * @param {number} ms
 * @returns {string} e.g. "4m 32s" | "45s"
 */
export function fmtEta(ms) {
  const s = Math.round(ms / 1000)
  if (s < 60)  return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r > 0 ? `${m}m ${r}s` : `${m}m`
}
