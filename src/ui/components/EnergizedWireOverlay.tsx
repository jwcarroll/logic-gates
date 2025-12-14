import type { CSSProperties } from 'react'
import { workspaceTokens, type WorkspaceTheme } from '../../design/tokens/workspace'

export type WireView = {
  wireId: string
  energized: boolean
  direction: 'forward' | 'reverse' | null
  intensity: number
}

type Props = {
  wires: WireView[]
  theme?: WorkspaceTheme
}

export function EnergizedWireOverlay({ wires, theme = 'dark' }: Props) {
  const palette = workspaceTokens.energized.theme[theme]
  return (
    <div className="energized-overlay" data-theme={theme}>
      {wires.map((wire) => {
        const style: CSSProperties = wire.energized
          ? {
              ['--wire-base' as string]: palette.base,
              ['--wire-gradient-start' as string]: palette.gradient[0],
              ['--wire-gradient-end' as string]: palette.gradient[1],
              ['--wire-intensity' as string]: wire.intensity,
            }
          : { ['--wire-base' as string]: palette.inactive }
        return (
          <div
            key={wire.wireId}
            className="energized-wire"
            data-testid="energized-wire"
            data-state={wire.energized ? 'energized' : 'idle'}
            data-direction={wire.direction ?? 'none'}
            style={style}
          />
        )
      })}
    </div>
  )
}
