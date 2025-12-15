import { useMemo, useState } from 'react'
import { useAppStore } from '../../app/store'

export function GroupInterfaceEditor() {
  const draft = useAppStore((s) => s.groupInterfaceDraft)
  const cancel = useAppStore((s) => s.cancelGroupInterfaceDraft)
  const confirm = useAppStore((s) => s.confirmGroupInterfaceDraft)
  const updateLabel = useAppStore((s) => s.updateGroupInterfaceDraftLabel)
  const addPort = useAppStore((s) => s.addGroupInterfaceDraftPort)
  const removePort = useAppStore((s) => s.removeGroupInterfaceDraftPort)
  const movePort = useAppStore((s) => s.moveGroupInterfaceDraftPort)
  const updateName = useAppStore((s) => s.updateGroupInterfaceDraftPortName)
  const updateMapping = useAppStore((s) => s.updateGroupInterfaceDraftPortMapping)
  const [confirmingEdit, setConfirmingEdit] = useState(false)

  const canConfirm = (draft?.errors?.length ?? 0) === 0 && (draft?.interfaceDraft.inputs.length ?? 0) + (draft?.interfaceDraft.outputs.length ?? 0) > 0

  const availableInputs = useMemo(() => draft?.available.inputs ?? [], [draft?.available.inputs])
  const availableOutputs = useMemo(() => draft?.available.outputs ?? [], [draft?.available.outputs])

  if (!draft) return null
  const isEdit = draft.mode === 'edit'

  return (
    <div className="toolbar-section">
      <h3>{isEdit ? 'Edit group interface' : 'Group interface'}</h3>

      {draft.mode === 'create' ? (
        <label className="toolbar-label">
          Label
          <input className="toolbar-input" value={draft.label} onChange={(e) => updateLabel(e.target.value)} />
        </label>
      ) : null}

      <div className="group-interface-editor__section">
        <div className="group-interface-editor__section-title">
          <span>Inputs</span>
          <button className="toolbar-button toolbar-button--ghost" type="button" onClick={() => addPort('input')}>
            + Input
          </button>
        </div>
        {draft.interfaceDraft.inputs.map((p, idx) => (
          <div key={p.id} className="group-interface-editor__row">
            <input
              className="toolbar-input"
              value={p.name}
              placeholder={`Input ${idx + 1}`}
              onChange={(e) => updateName('input', p.id, e.target.value)}
            />
            <select
              className="toolbar-input"
              value={p.mapsToInternalPortId}
              onChange={(e) => updateMapping('input', p.id, e.target.value)}
            >
              <option value="">Map to…</option>
              {availableInputs.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <div className="group-interface-editor__row-actions">
              <button className="toolbar-button toolbar-button--ghost" type="button" onClick={() => movePort('input', p.id, -1)} disabled={idx === 0}>
                ↑
              </button>
              <button
                className="toolbar-button toolbar-button--ghost"
                type="button"
                onClick={() => movePort('input', p.id, 1)}
                disabled={idx === draft.interfaceDraft.inputs.length - 1}
              >
                ↓
              </button>
              <button className="toolbar-button toolbar-button--ghost" type="button" onClick={() => removePort('input', p.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="group-interface-editor__section">
        <div className="group-interface-editor__section-title">
          <span>Outputs</span>
          <button className="toolbar-button toolbar-button--ghost" type="button" onClick={() => addPort('output')}>
            + Output
          </button>
        </div>
        {draft.interfaceDraft.outputs.map((p, idx) => (
          <div key={p.id} className="group-interface-editor__row">
            <input
              className="toolbar-input"
              value={p.name}
              placeholder={`Output ${idx + 1}`}
              onChange={(e) => updateName('output', p.id, e.target.value)}
            />
            <select
              className="toolbar-input"
              value={p.mapsToInternalPortId}
              onChange={(e) => updateMapping('output', p.id, e.target.value)}
            >
              <option value="">Map to…</option>
              {availableOutputs.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <div className="group-interface-editor__row-actions">
              <button className="toolbar-button toolbar-button--ghost" type="button" onClick={() => movePort('output', p.id, -1)} disabled={idx === 0}>
                ↑
              </button>
              <button
                className="toolbar-button toolbar-button--ghost"
                type="button"
                onClick={() => movePort('output', p.id, 1)}
                disabled={idx === draft.interfaceDraft.outputs.length - 1}
              >
                ↓
              </button>
              <button className="toolbar-button toolbar-button--ghost" type="button" onClick={() => removePort('output', p.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {draft.errors.length ? (
        <div className="group-interface-editor__errors" role="alert">
          {draft.errors.map((err) => (
            <div key={err}>{err}</div>
          ))}
        </div>
      ) : null}

      <div className="group-interface-editor__footer">
        {isEdit ? (
          confirmingEdit ? (
            <div className="group-interface-editor__confirm-warning" role="alert">
              <div>Updating a group interface will disconnect all existing wires connected to this group.</div>
              <div>Rewiring required.</div>
              <div className="group-interface-editor__confirm-actions">
                <button
                  className="toolbar-button"
                  type="button"
                  onClick={() => {
                    const result = confirm()
                    if (!result.ok) return
                    setConfirmingEdit(false)
                  }}
                  disabled={!canConfirm}
                >
                  Disconnect wires and update
                </button>
                <button className="toolbar-button toolbar-button--ghost" type="button" onClick={() => setConfirmingEdit(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="toolbar-button" type="button" onClick={() => setConfirmingEdit(true)} disabled={!canConfirm}>
              Update interface
            </button>
          )
        ) : (
          <button className="toolbar-button" type="button" onClick={() => confirm()} disabled={!canConfirm}>
            Create group
          </button>
        )}
        <button className="toolbar-button toolbar-button--ghost" type="button" onClick={() => cancel()}>
          Cancel
        </button>
      </div>
    </div>
  )
}
