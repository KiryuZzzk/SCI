import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext.jsx'

export default function useFilters() {
  const { state, dispatch } = useAppContext()
  const { activeTypes, selectedAlcaldia } = state

  const toggleType = useCallback((key) => {
    dispatch({ type: 'TOGGLE_TYPE', payload: key })
  }, [dispatch])

  const setAlcaldia = useCallback((cve) => {
    dispatch({ type: 'SET_ALCALDIA', payload: cve })
  }, [dispatch])

  return { activeTypes, selectedAlcaldia, toggleType, setAlcaldia }
}
