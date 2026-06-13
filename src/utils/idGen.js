// Formal ICS/NIMS ID generation
// Format: INC-YYYY-MMDD-NNNN (4-digit zero-padded sequential per session)

const KEY_INC = 'sci_inc_counter'
const KEY_DSP = 'sci_dsp_counter'
const KEY_OP  = 'sci_op_counter'

function getNext(key) {
  const n = parseInt(sessionStorage.getItem(key) ?? '0', 10) + 1
  sessionStorage.setItem(key, String(n))
  return n
}

function datePart(d = new Date()) {
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}${da}`
}

export function nextIncidentId(date = new Date()) {
  const n = getNext(KEY_INC)
  return `INC-${datePart(date)}-${String(n).padStart(4, '0')}`
}

export function nextDispatchId(date = new Date()) {
  const n = getNext(KEY_DSP)
  return `DSP-${datePart(date)}-${String(n).padStart(4, '0')}`
}

export function nextOpId() {
  const n = getNext(KEY_OP)
  return `OP-${String(n).padStart(2, '0')}`
}

/** Reset all counters (call on SCI_RESET) */
export function resetIdCounters() {
  sessionStorage.removeItem(KEY_INC)
  sessionStorage.removeItem(KEY_DSP)
  sessionStorage.removeItem(KEY_OP)
}
