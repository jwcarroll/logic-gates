import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('reactflow', () => ({
  Handle: (props: any) => <div data-testid={`handle-${props.id}`} />,
  Position: { Left: 'Left', Right: 'Right' },
}))

import { LogicNode } from '../../ui/components/LogicNode'

describe('Group port labels', () => {
  it('renders group port names in order (not raw ids)', () => {
    const { container, queryByText } = render(
      <LogicNode
        id="g1"
        data={{
          label: 'My Group',
          kind: 'group',
          inputs: ['in-a', 'in-b'],
          outputs: ['out-sum', 'out-carry'],
          portLabels: { 'in-a': 'A', 'in-b': 'B', 'out-sum': 'SUM', 'out-carry': 'CARRY' },
          inputStates: {},
          outputStates: {},
        }}
        selected={false}
        dragging={false}
        isConnectable
        type="logicNode"
        xPos={0}
        yPos={0}
        zIndex={0}
      />,
    )

    const inputLabels = Array.from(container.querySelectorAll('.logic-node__port-label--input')).map((el) => el.textContent)
    expect(inputLabels).toEqual(['A', 'B'])

    const outputLabels = Array.from(container.querySelectorAll('.logic-node__port-label--output')).map((el) => el.textContent)
    expect(outputLabels).toEqual(['SUM', 'CARRY'])

    expect(queryByText('in-a')).toBeNull()
    expect(queryByText('out-carry')).toBeNull()
  })
})

