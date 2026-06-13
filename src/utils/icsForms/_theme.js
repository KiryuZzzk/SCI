/**
 * Tema institucional compartido para todos los formatos ICS.
 * Paleta clara: fondo blanco, tipografía oscura, accent rojo institucional.
 * Helpers re-utilizables para sectionHeader, metaBlock, tableHead, etc.
 */

// ── Paleta institucional ────────────────────────────────────────────
export const C = {
  // Tinta
  ink:      [17,  24,  39],   // gris-900: títulos, valores
  subInk:   [55,  65,  81],   // gris-700: subtítulos
  muted:    [107, 114, 128],  // gris-500: labels, metadata
  light:    [156, 163, 175],  // gris-400: notas suaves
  // Reglas y fondos
  rule:     [203, 213, 225],  // gris-300: bordes
  ruleSoft: [226, 232, 240],  // gris-200: bordes finos
  band:     [241, 245, 249],  // gris-100: header band sección
  rowAlt:   [248, 250, 252],  // gris-50:  fila alternada
  // Accent institucional (rojo PC)
  accent:   [153, 27,  27],   // rojo-800: accent principal
  accentSoft: [254, 226, 226], // rojo-100: fondo sutil
  // Estados
  crit:     [185, 28,  28],
  warn:     [161, 98,  7],
  ok:       [21,  128, 61],
  info:     [29,  78,  216],
  // Blanco
  white:    [255, 255, 255],
}

export const LEVEL_COLOR = {
  critical: C.crit,
  dispatch: C.warn,
  info:     C.muted,
  arrival:  C.ok,
}

// ── Header oficial del formato ──────────────────────────────────────
/**
 * Header institucional: título grande, subtítulo, badge del código,
 * fecha de preparación. Termina con regla de color institucional.
 *
 * @returns {number} y final para empezar contenido
 */
export function drawHeader(doc, W, { formCode, title, subtitle, prepared, scenario }) {
  // Form code badge — esquina superior derecha
  const badgeW = 26
  const badgeH = 9
  const badgeX = W - 10 - badgeW
  const badgeY = 10
  doc.setFillColor(...C.accent)
  doc.rect(badgeX, badgeY, badgeW, badgeH, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C.white)
  doc.text(formCode, badgeX + badgeW / 2, badgeY + 6.2, { align: 'center' })

  // Título principal
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...C.ink)
  doc.text(title, 10, 15)

  // Subtítulo institucional
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.muted)
  doc.text(subtitle ?? 'Protección Civil CDMX · NIMS/ICS · SINAPROC', 10, 20)

  // Metadata
  doc.setFontSize(7.5)
  doc.setTextColor(...C.subInk)
  if (prepared) doc.text(`Preparado: ${prepared}`, 10, 25)
  if (scenario) {
    doc.setTextColor(...C.muted)
    doc.text(`Escenario: ${scenario}`, 100, 25)
  }

  // Regla institucional
  doc.setDrawColor(...C.accent)
  doc.setLineWidth(0.6)
  doc.line(10, 29, W - 10, 29)
  doc.setLineWidth(0.2)
  doc.setDrawColor(...C.ruleSoft)
  doc.line(10, 30.2, W - 10, 30.2)

  return 36
}

// ── Section header ──────────────────────────────────────────────────
export function drawSection(doc, W, y, label) {
  // Fondo banda gris claro
  doc.setFillColor(...C.band)
  doc.rect(10, y, W - 20, 6.5, 'F')
  // Stripe accent izquierda
  doc.setFillColor(...C.accent)
  doc.rect(10, y, 1.4, 6.5, 'F')
  // Texto
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.ink)
  doc.text(label, 13.5, y + 4.5)
  return y + 9
}

// ── Meta block (label : value) ──────────────────────────────────────
export function drawMeta(doc, W, y, fields, opts = {}) {
  const rowH = opts.rowH ?? 5.5
  const labelW = opts.labelW ?? 46
  const padX = 12
  const totalH = fields.length * rowH + 2

  // Borde externo
  doc.setDrawColor(...C.rule)
  doc.setLineWidth(0.2)
  doc.rect(10, y, W - 20, totalH, 'S')

  for (let i = 0; i < fields.length; i++) {
    const { label, value } = fields[i]
    const rowY = y + 1 + i * rowH

    // Separador horizontal fino entre filas
    if (i > 0) {
      doc.setDrawColor(...C.ruleSoft)
      doc.line(10, rowY, W - 10, rowY)
    }

    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C.muted)
    doc.text(label, padX, rowY + 3.8)

    // Value
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.ink)
    doc.text(String(value ?? '—'), padX + labelW, rowY + 3.8)
  }

  return y + totalH + 2
}

// ── Table head ──────────────────────────────────────────────────────
export function drawTableHead(doc, W, y, headers, colWidths) {
  const rowH = 6
  // Fondo
  doc.setFillColor(...C.ruleSoft)
  doc.rect(10, y, W - 20, rowH, 'F')
  // Borde inferior
  doc.setDrawColor(...C.rule)
  doc.setLineWidth(0.3)
  doc.line(10, y + rowH, W - 10, y + rowH)
  // Textos
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...C.ink)
  let cx = 12
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], cx, y + 4)
    cx += colWidths[i]
  }
  return y + rowH
}

// ── Table body row ──────────────────────────────────────────────────
export function drawTableRow(doc, W, y, index) {
  const rowH = 5.5
  if (index % 2 === 1) {
    doc.setFillColor(...C.rowAlt)
    doc.rect(10, y, W - 20, rowH, 'F')
  }
  doc.setDrawColor(...C.ruleSoft)
  doc.setLineWidth(0.1)
  doc.line(10, y + rowH, W - 10, y + rowH)
  return rowH
}

// ── Texto en celda truncado ─────────────────────────────────────────
export function cellText(doc, text, x, y, maxW) {
  const t = String(text ?? '—')
  const w = doc.getTextWidth(t)
  if (w <= maxW) {
    doc.text(t, x, y)
    return
  }
  // Truncar manteniendo final con "…"
  const ratio = maxW / w
  const cut = Math.max(1, Math.floor(t.length * ratio) - 1)
  doc.text(t.slice(0, cut) + '…', x, y)
}

// ── Continuación de página ──────────────────────────────────────────
export function drawPageContinuation(doc, W, formCode, ref) {
  doc.setDrawColor(...C.accent)
  doc.setLineWidth(0.6)
  doc.line(10, 12, W - 10, 12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.ink)
  doc.text(`${formCode} · ${ref ?? '—'}`, 10, 9)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(...C.muted)
  doc.text('(continuación)', W - 10, 9, { align: 'right' })
}

// ── Footer en todas las páginas ─────────────────────────────────────
export function applyFooters(doc, W, formCode) {
  const n = doc.getNumberOfPages()
  const H = doc.internal.pageSize.getHeight()
  const footerY = H - 10

  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    // Regla superior
    doc.setDrawColor(...C.ruleSoft)
    doc.setLineWidth(0.3)
    doc.line(10, footerY - 4, W - 10, footerY - 4)
    // Texto footer
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.text(
      `${formCode}  ·  Compatible NIMS/ICS · SINAPROC · PC-CDMX`,
      10,
      footerY,
    )
    doc.text(`Página ${i} / ${n}`, W - 10, footerY, { align: 'right' })
  }
}

// ── Bloque de mensaje vacío ─────────────────────────────────────────
export function drawEmpty(doc, W, y, msg = '— Sin datos —') {
  doc.setDrawColor(...C.ruleSoft)
  doc.setLineWidth(0.2)
  doc.rect(10, y, W - 20, 8, 'S')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.muted)
  doc.text(msg, W / 2, y + 5.2, { align: 'center' })
  return y + 11
}

// ── Logo / brand block (opcional) ───────────────────────────────────
export function drawSignatureBlock(doc, W, y, { name, role, org, datetime }) {
  const blockH = 28
  doc.setDrawColor(...C.rule)
  doc.setLineWidth(0.2)
  doc.rect(10, y, W - 20, blockH, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...C.muted)
  doc.text('NOMBRE', 14, y + 5)
  doc.text('CARGO',  W / 2 + 4, y + 5)
  doc.text('ORGANIZACIÓN', 14, y + 15)
  doc.text('FECHA / HORA', W / 2 + 4, y + 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C.ink)
  doc.text(name  ?? '—', 14, y + 9.5)
  doc.text(role  ?? '—', W / 2 + 4, y + 9.5)
  doc.text(org   ?? '—', 14, y + 19.5)
  doc.text(datetime ?? '—', W / 2 + 4, y + 19.5)

  // Línea de firma
  doc.setDrawColor(...C.rule)
  doc.line(14, y + 25, W / 2 - 4, y + 25)
  doc.line(W / 2 + 4, y + 25, W - 14, y + 25)
  doc.setFontSize(6)
  doc.setTextColor(...C.muted)
  doc.text('FIRMA', 14, y + 27)
  doc.text('SELLO', W / 2 + 4, y + 27)

  return y + blockH + 2
}
