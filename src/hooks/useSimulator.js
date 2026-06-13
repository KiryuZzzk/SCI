import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext.jsx'

export default function useSimulator() {
  const { state, dispatch } = useAppContext()
  const { simulatorActive, hypothetical } = state

  const addResource = useCallback((type, lat, lng) => {
    dispatch({ type: 'ADD_HYPOTHETICAL', payload: { type, lat, lng } })
  }, [dispatch])

  const moveResource = useCallback((id, lat, lng) => {
    dispatch({ type: 'MOVE_HYPOTHETICAL', payload: { id, lat, lng } })
  }, [dispatch])

  const removeResource = useCallback((id) => {
    dispatch({ type: 'REMOVE_HYPOTHETICAL', payload: id })
  }, [dispatch])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET_SIMULATOR' })
  }, [dispatch])

  const toggle = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIMULATOR' })
  }, [dispatch])

  return {
    simulatorActive,
    hypothetical,
    addResource,
    moveResource,
    removeResource,
    reset,
    toggle,
  }
}
