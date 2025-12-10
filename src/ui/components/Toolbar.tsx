import { useMemo } from 'react'
import { useAppStore } from '../../app/store'
import type { GateType } from '../../core/types'

const gateTypes: GateType[] = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR']

export const Toolbar = () => {
  const addSwitch = useAppStore((s) => s.addSwitch)
  const addLight = useAppStore((s) => s.addLight)
  const addGate = useAppStore((s) => s.addGate)
  const startDrag = useAppStore((s) => s.startDrag)
  const cancelDrag = useAppStore((s) => s.cancelDrag)
  const reset = useAppStore((s) => s.reset)
  const exportCircuit = useAppStore((s) => s.exportCircuit)
  const importCircuit = useAppStore((s) => s.importCircuit)
  const groupSelection = useAppStore((s) => s.groupSelection)
  const ungroupSelection = useAppStore((s) => s.ungroupSelection)
  const cloneSelectedGroup = useAppStore((s) => s.cloneSelectedGroup)
  const addHalfAdderTemplate = useAppStore((s) => s.addHalfAdderTemplate)
  const selectedNodeIds = useAppStore((s) => s.selectedNodeIds)
  const circuit = useAppStore((s) => s.circuit)
  const hasGroupSelected = selectedNodeIds.some((id) => circuit.nodes.find((n) => n.id === id && n.type === 'group'))

  const gateButtons = useMemo(
    () =>
      gateTypes.map((gate) => (
        <button
          key={gate}
          className="toolbar-button"
          draggable
          onDragStart={() => startDrag('gate', gate)}
          onDragEnd={() => cancelDrag()}
          onClick={() => addGate(gate)}
        >
          {gate} gate
        </button>
      )),
    [addGate, startDrag, cancelDrag],
  )

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Components</h3>
        <button
          className="toolbar-button"
          draggable
          onDragStart={() => startDrag('switch')}
          onDragEnd={() => cancelDrag()}
          onClick={() => addSwitch()}
        >
          Add switch
        </button>
        {gateButtons}
        <button
          className="toolbar-button"
          draggable
          onDragStart={() => startDrag('light')}
          onDragEnd={() => cancelDrag()}
          onClick={() => addLight()}
        >
          Add light
        </button>
      </div>
      <div className="toolbar-section">
        <h3>Actions</h3>
        <button className="toolbar-button" onClick={() => groupSelection()} disabled={!selectedNodeIds.length}>
          Group selected ({selectedNodeIds.length})
        </button>
        <button className="toolbar-button" onClick={() => cloneSelectedGroup()} disabled={!hasGroupSelected}>
          Clone selected group
        </button>
        <button className="toolbar-button" onClick={() => ungroupSelection()} disabled={!hasGroupSelected}>
          Ungroup selected
        </button>
        <button className="toolbar-button" onClick={() => addHalfAdderTemplate()}>
          Add half-adder subcircuit
        </button>
        <button className="toolbar-button toolbar-button--ghost" onClick={() => reset()}>
          Clear canvas
        </button>
        <button
          className="toolbar-button toolbar-button--ghost"
          onClick={() => {
            const exported = exportCircuit()
            const blob = JSON.stringify(exported, null, 2)
            navigator.clipboard?.writeText(blob).catch(() => {})
            alert('Circuit copied to clipboard (JSON).')
          }}
        >
          Export JSON
        </button>
        <button
          className="toolbar-button toolbar-button--ghost"
          onClick={() => {
            const input = prompt('Paste circuit JSON to import')
            if (!input) return
            try {
              const parsed = JSON.parse(input)
              const result = importCircuit(parsed)
              if (!result.ok) {
                alert(`Import failed: ${(result.errors || []).join(', ')}`)
              }
            } catch (err) {
              alert('Invalid JSON')
            }
          }}
        >
          Import JSON
        </button>
      </div>
    </div>
  )
}
