import { useMemo } from 'react'
import { useAppStore } from '../../app/store'
import type { GateType } from '../../core/types'

const gateTypes: GateType[] = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR']

export const Toolbar = () => {
  const addSwitch = useAppStore((s) => s.addSwitch)
  const addLight = useAppStore((s) => s.addLight)
  const addGate = useAppStore((s) => s.addGate)
  const reset = useAppStore((s) => s.reset)

  const gateButtons = useMemo(
    () =>
      gateTypes.map((gate) => (
        <button key={gate} className="toolbar-button" onClick={() => addGate(gate)}>
          {gate} gate
        </button>
      )),
    [addGate],
  )

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Components</h3>
        <button className="toolbar-button" onClick={() => addSwitch()}>
          Add switch
        </button>
        {gateButtons}
        <button className="toolbar-button" onClick={() => addLight()}>
          Add light
        </button>
      </div>
      <div className="toolbar-section">
        <h3>Actions</h3>
        <button className="toolbar-button toolbar-button--ghost" onClick={() => reset()}>
          Clear canvas
        </button>
      </div>
    </div>
  )
}
