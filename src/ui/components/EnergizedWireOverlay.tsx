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
  const animation = workspaceTokens.energized.animation
  return (
    <div
      className="energized-overlay"
      data-theme={theme}
      style={
        {
          ['--wire-flow-duration' as string]: `${animation.durationMs}ms`,
          ['--wire-dasharray' as string]: animation.dashArray,
        } as CSSProperties
      }
    >
      {wires.map((wire) => {
        const style: CSSProperties = wire.energized
          ? ({
              ['--wire-base' as string]: palette.base,
              ['--wire-gradient-start' as string]: palette.gradient[0],
              ['--wire-gradient-end' as string]: palette.gradient[1],
              ['--wire-intensity' as string]: wire.intensity,
              opacity: Math.max(0, Math.min(1, wire.intensity)),
            } satisfies CSSProperties)
          : ({
              ['--wire-base' as string]: palette.inactive,
              opacity: 0.2,
            } satisfies CSSProperties)
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
