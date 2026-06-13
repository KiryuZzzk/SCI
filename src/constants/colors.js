// Gap score color scale: 0 (excellent) → 100 (critical)
export const GAP_COLORS = {
  excellent: '#06b6d4', // cyan  — score < 0
  good:      '#22c55e', // green — 0–20
  moderate:  '#f59e0b', // amber — 20–50
  critical:  '#ef4444', // red   — ≥ 50
}

export function scoreToColor(score) {
  if (score === null || score === undefined) return '#243040'
  if (score < 0)  return GAP_COLORS.excellent
  if (score < 20) return GAP_COLORS.good
  if (score < 50) return GAP_COLORS.moderate
  return GAP_COLORS.critical
}

export function scoreToLabel(score) {
  if (score === null || score === undefined) return 'Sin datos'
  if (score < 0)  return 'Excelente'
  if (score < 20) return 'Buena cobertura'
  if (score < 50) return 'Brecha moderada'
  return 'Brecha crítica'
}

// Framer Motion easing — matches sibling projects
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]

export const SPRING_SIDEBAR = { stiffness: 300, damping: 30 }
export const SPRING_CARD = { stiffness: 155, damping: 28, mass: 0.6 }
