import type { FC } from 'react'
import { Handle, Position } from 'reactflow'

interface LogicNodeData {
  label: string
  meta?: string
  inputs: string[]
  outputs: string[]
  kind: 'switch' | 'gate' | 'light' | 'group'
  gateType?: string
  switchState?: boolean
  lightState?: boolean
  inputStates: Record<string, boolean | undefined>
  outputStates: Record<string, boolean | undefined>
  onToggle?: () => void
}

interface Props {
  data: LogicNodeData
}

export const LogicNode: FC<Props> = ({ data }) => {
  const renderHeader = () => (
    <div className="logic-node__label">
      <span>{data.label}</span>
      {data.meta ? <span className="logic-node__meta">{data.meta}</span> : null}
    </div>
  )

  const renderBody = () => {
    if (data.kind === 'switch') {
      const isOn = data.switchState
      return (
        <button
          type="button"
          className={`logic-node__switch ${isOn ? 'logic-node__switch--on' : ''}`}
          onClick={data.onToggle}
        >
          {isOn ? 'On' : 'Off'}
        </button>
      )
    }
    if (data.kind === 'light') {
      const lit = data.lightState
      return <div className={`logic-node__light ${lit ? 'logic-node__light--on' : ''}`}>{lit ? 'On' : 'Off'}</div>
    }
    return null
  }

  return (
    <div className="logic-node">
      {renderHeader()}
      <div className="logic-node__ports">
        <div className="logic-node__ports-col">
          {data.inputs.map((portId) => (
            <Handle
              key={portId}
              id={portId}
              type="target"
              position={Position.Left}
              className={`logic-node__handle logic-node__handle--input ${
                data.inputStates[portId] ? 'logic-node__handle--active' : ''
              }`}
            />
          ))}
        </div>
        <div className="logic-node__ports-col logic-node__ports-col--outputs">
          {data.outputs.map((portId) => (
            <Handle
              key={portId}
              id={portId}
              type="source"
              position={Position.Right}
              className={`logic-node__handle logic-node__handle--output ${
                data.outputStates[portId] ? 'logic-node__handle--active' : ''
              }`}
            />
          ))}
        </div>
      </div>
      {renderBody()}
    </div>
  )
}
