import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../store'
import { selectWireState } from '../store/workspaceSelectors'

export const useEnergizedWires = () => {
  const wires = useAppStore(useShallow(selectWireState))
  return useMemo(() => wires, [wires])
}
