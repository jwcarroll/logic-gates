import { useEffect, useRef, useState } from 'react'

/**
 * Debounce simulation state updates to align with render frames and avoid excessive ReactFlow churn.
 */
export function useSimulationSync(outputs: Record<string, boolean>, lights: Record<string, boolean>) {
  const [syncedOutputs, setSyncedOutputs] = useState(outputs)
  const [syncedLights, setSyncedLights] = useState(lights)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
    }
    frame.current = requestAnimationFrame(() => {
      setSyncedOutputs(outputs)
      setSyncedLights(lights)
    })
    return () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current)
      }
    }
  }, [outputs, lights])

  return { outputs: syncedOutputs, lights: syncedLights }
}
