import { useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import { useAppStore } from '../store'
import { selectWireState } from '../store/workspaceSelectors'

export const useEnergizedWires = () => {
  const wires = useAppStore((s) => selectWireState(s), shallow)
  return useMemo(() => wires, [wires])
}
