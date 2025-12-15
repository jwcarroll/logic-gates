import { Fragment, type FC } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

interface LogicNodeData {
  label: string
  meta?: string
  inputs: string[]
  outputs: string[]
  kind: 'switch' | 'gate' | 'light' | 'group' | 'junction'
  gateType?: string
  switchState?: boolean
  lightState?: boolean
  portLabels?: Record<string, string>
  inputStates: Record<string, boolean | undefined>
  outputStates: Record<string, boolean | undefined>
  onToggle?: () => void
}

export const LogicNode: FC<NodeProps<LogicNodeData>> = ({ data, selected }) => {
  const inputStyle = (idx: number) => ({
    top: `${((idx + 1) / (data.inputs.length + 1)) * 100}%`,
  })
  const outputStyle = (idx: number) => ({
    top: `${((idx + 1) / (data.outputs.length + 1)) * 100}%`,
  })

  const renderHeader = () => (
    <div className="logic-node__label">
      <span>{data.label}</span>
      {data.meta ? <span className="logic-node__meta">{data.meta}</span> : null}
      {selected ? <span className="logic-node__badge">Selected</span> : null}
    </div>
  )

  const renderBody = () => {
    if (data.kind === 'switch') {
      const isOn = data.switchState
      return (
        <button type="button" className={`logic-node__switch ${isOn ? 'logic-node__switch--on' : ''}`} onClick={data.onToggle}>
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
    <div className={`logic-node ${data.kind === 'junction' ? 'logic-node--junction' : ''} ${selected ? 'logic-node--selected' : ''}`}>
      {renderHeader()}
      <div className="logic-node__ports">
        <div className="logic-node__ports-col">
          {data.inputs.map((portId, idx) => (
            <Fragment key={portId}>
              {data.portLabels?.[portId] ? (
                <div className="logic-node__port-label logic-node__port-label--input" style={inputStyle(idx)}>
                  {data.portLabels[portId]}
                </div>
              ) : null}
              <Handle
                id={portId}
                type="target"
                position={Position.Left}
                style={inputStyle(idx)}
                className={`logic-node__handle logic-node__handle--input ${
                  data.inputStates[portId] ? 'logic-node__handle--active' : ''
                }`}
              />
            </Fragment>
          ))}
        </div>
        <div className="logic-node__ports-col logic-node__ports-col--outputs">
          {data.outputs.map((portId, idx) => (
            <Fragment key={portId}>
              {data.portLabels?.[portId] ? (
                <div className="logic-node__port-label logic-node__port-label--output" style={outputStyle(idx)}>
                  {data.portLabels[portId]}
                </div>
              ) : null}
              <Handle
                id={portId}
                type="source"
                position={Position.Right}
                style={outputStyle(idx)}
                className={`logic-node__handle logic-node__handle--output ${
                  data.outputStates[portId] ? 'logic-node__handle--active' : ''
                }`}
              />
            </Fragment>
          ))}
        </div>
      </div>
      {renderBody()}
    </div>
  )
}
