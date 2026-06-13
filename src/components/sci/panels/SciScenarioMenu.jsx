import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import {
  Save, FolderOpen, Download, Upload, Trash2, Database, ChevronUp,
} from 'lucide-react'
import {
  saveSnapshot, listSnapshots, loadSnapshot, deleteSnapshot,
  exportSciBlob, parseSciImport,
} from '../../../utils/sciPersistence.js'
import { downloadBlob } from '../../../utils/format/helpers.js'

function fmtDate(ts) {
  return new Date(ts).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function SciScenarioMenu() {
  const { state, dispatch } = useAppContext()
  const { sci } = state
  const [open, setOpen] = useState(false)
  const [snaps, setSnaps] = useState([])
  const [naming, setNaming] = useState(false)
  const [nameVal, setNameVal] = useState('')
  const fileRef = useRef(null)

  const refresh = () => setSnaps(listSnapshots())

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) refresh()
  }

  const doSave = () => {
    if (!nameVal.trim()) return
    saveSnapshot(nameVal.trim(), sci)
    setNameVal('')
    setNaming(false)
    refresh()
    dispatch({ type: 'SCI_LOG_EVENT', payload: { level: 'info', msg: `Escenario guardado: ${nameVal.trim()}` } })
  }

  const doLoad = (id, name) => {
    const restored = loadSnapshot(id)
    if (restored) {
      dispatch({ type: 'SCI_RESTORE', payload: restored })
      dispatch({ type: 'SCI_LOG_EVENT', payload: { level: 'info', msg: `Escenario cargado: ${name}` } })
      setOpen(false)
    }
  }

  const doDelete = (id) => { deleteSnapshot(id); refresh() }

  const doExport = () => {
    const blob = exportSciBlob(sci, { incidentCount: sci.incidents.length })
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    downloadBlob(`escenario-sci_${stamp}.json`, blob)
  }

  const doImportClick = () => fileRef.current?.click()
  const doImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const imported = parseSciImport(text)
      dispatch({ type: 'SCI_RESTORE', payload: imported })
      dispatch({ type: 'SCI_LOG_EVENT', payload: { level: 'info', msg: `Escenario importado: ${file.name}` } })
      setOpen(false)
    } catch (err) {
      alert(`Error al importar:\n${err.message}`)
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="absolute bottom-4 left-4 z-[850]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="absolute bottom-full mb-2 left-0 w-64 bg-[#0c1520]/97 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Acciones */}
            <div className="p-2 border-b border-slate-700/40 grid grid-cols-2 gap-1.5">
              {naming ? (
                <div className="col-span-2 flex gap-1.5">
                  <input
                    autoFocus
                    value={nameVal}
                    onChange={e => setNameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') doSave(); if (e.key === 'Escape') setNaming(false) }}
                    placeholder="Nombre del escenario…"
                    className="flex-1 min-w-0 bg-slate-900/70 border border-slate-700/50 rounded-lg px-2 py-1.5 text-[10px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-600/60"
                  />
                  <button onClick={doSave}
                    className="shrink-0 px-2.5 rounded-lg text-[10px] font-semibold bg-amber-600/90 hover:bg-amber-500 text-white">OK</button>
                </div>
              ) : (
                <button onClick={() => setNaming(true)}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-800/70 hover:bg-slate-700 border border-slate-700/50 text-slate-300 transition-colors">
                  <Save size={11} strokeWidth={2} /> Guardar
                </button>
              )}
              {!naming && (
                <button onClick={doExport}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-800/70 hover:bg-slate-700 border border-slate-700/50 text-slate-300 transition-colors">
                  <Download size={11} strokeWidth={2} /> Exportar
                </button>
              )}
              {!naming && (
                <button onClick={doImportClick}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-800/70 hover:bg-slate-700 border border-slate-700/50 text-slate-300 transition-colors">
                  <Upload size={11} strokeWidth={2} /> Importar JSON
                </button>
              )}
            </div>

            {/* Snapshots guardados */}
            <div className="max-h-64 overflow-y-auto">
              {snaps.length === 0 ? (
                <div className="px-3 py-4 text-center text-[10px] text-slate-600 italic">
                  Sin escenarios guardados
                </div>
              ) : (
                snaps.map(s => (
                  <div key={s.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50 border-b border-slate-800/40 group">
                    <button onClick={() => doLoad(s.id, s.name)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left">
                      <FolderOpen size={12} className="text-slate-500 shrink-0" strokeWidth={2} />
                      <div className="min-w-0">
                        <div className="text-[10.5px] text-slate-200 font-medium truncate">{s.name}</div>
                        <div className="text-[8.5px] text-slate-600">
                          {s.incidentCount} inc · {fmtDate(s.savedAt)}
                        </div>
                      </div>
                    </button>
                    <button onClick={() => doDelete(s.id)}
                      title="Eliminar"
                      className="shrink-0 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileRef} type="file" accept="application/json,.json" onChange={doImportFile} className="hidden" />

      {/* Toggle button */}
      <button
        onClick={toggle}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0c1520]/97 backdrop-blur-md border border-slate-700/50 shadow-xl text-slate-300 hover:text-slate-100 hover:border-slate-600 transition-colors"
      >
        <Database size={13} strokeWidth={2} />
        <span className="text-[10.5px] font-semibold">Escenarios</span>
        <ChevronUp size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}
