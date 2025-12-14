import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { EnergizedWireOverlay } from '../../ui/components/EnergizedWireOverlay'
import { workspaceTokens } from '../../design/tokens/workspace'

describe('[US2] energized wire styles', () => {
  it('renders energized and idle wires with gradient tokens', () => {
    const { getAllByTestId } = render(
      <EnergizedWireOverlay
        theme="dark"
        wires={[
          { wireId: 'w1', energized: true, direction: 'forward', intensity: 0.8 },
          { wireId: 'w2', energized: false, direction: null, intensity: 0 },
        ]}
      />,
    )

    const wires = getAllByTestId('energized-wire')
    expect(wires).toHaveLength(2)
    expect(wires[0].dataset.state).toBe('energized')
    expect(wires[0].style.getPropertyValue('--wire-gradient-start')).toBe(workspaceTokens.energized.theme.dark.gradient[0])
    expect(wires[1].dataset.state).toBe('idle')
    expect(wires[1].style.getPropertyValue('--wire-base')).toBe(workspaceTokens.energized.theme.dark.inactive)
  })
})
