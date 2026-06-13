import { useMemo } from 'react'
import { computeGapScores, summarizeScores } from '../utils/scoring.js'

export default function useGapScore({ colonias, incidents, hospitals, fireStations, activeTypes, hypothetical }) {
  const scores = useMemo(() => {
    if (!colonias || !incidents || !hospitals || !fireStations) return new Map()
    return computeGapScores({ colonias, incidents, hospitals, fireStations, activeTypes, hypothetical })
  }, [colonias, incidents, hospitals, fireStations, activeTypes, hypothetical])

  const summary = useMemo(() => summarizeScores(scores), [scores])

  return { scores, summary }
}
