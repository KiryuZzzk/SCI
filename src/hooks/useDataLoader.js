import { useEffect, useState } from 'react'

const DATA_FILES = [
  { key: 'metadata',     url: '/data/metadata.json' },
  { key: 'alcaldias',    url: '/data/alcaldias.geojson' },
  { key: 'colonias',     url: '/data/colonias.geojson' },
  { key: 'incidents',    url: '/data/incidents-by-colonia.json' },
  { key: 'hospitals',    url: '/data/hospitals.json' },
  { key: 'fireStations', url: '/data/fire-stations.json' },
]

const SCI_RESOURCES_URL = '/data/sci/resources-static.json'

export default function useDataLoader(dispatch) {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const results = {}
        const total = DATA_FILES.length

        for (let i = 0; i < total; i++) {
          const { key, url } = DATA_FILES[i]
          const res = await fetch(url)
          if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`)
          results[key] = await res.json()
          if (!cancelled) setProgress(Math.round(((i + 1) / total) * 100))
        }

        if (!cancelled) {
          dispatch({ type: 'DATA_LOADED', payload: results })
          // Lazy load SCI resources catalog (non-blocking for loading screen)
          try {
            const sciRes = await fetch(SCI_RESOURCES_URL)
            if (sciRes.ok) {
              const sciJson = await sciRes.json()
              dispatch({ type: 'SCI_LOAD_RESOURCES', payload: sciJson })
            }
          } catch (e) {
            console.warn('SCI resources catalog no disponible:', e)
          }
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    load()
    return () => { cancelled = true }
  }, [dispatch])

  return { loading, progress, error }
}
