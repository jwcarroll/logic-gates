import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { workspaceTokens, type WorkspaceTheme } from '../../design/tokens/workspace'

export type SelectionStyle = {
  stroke: string
  strokeWidth: number
  halo: string
  fill: string
  vectorEffect: 'non-scaling-stroke'
  cssVars: CSSProperties
}

export const useSelectionStyles = (theme: WorkspaceTheme = 'dark'): SelectionStyle => {
  const tokens = workspaceTokens.selection
  return useMemo(() => {
    const palette = tokens.theme[theme]
    const cssVars: CSSProperties = {
      ['--selection-stroke' as string]: palette.stroke,
      ['--selection-fill' as string]: palette.fill,
      ['--selection-glow' as string]: palette.glow,
      ['--selection-handle' as string]: palette.handle,
    }
    return {
      stroke: palette.stroke,
      strokeWidth: tokens.strokeWidth,
      halo: palette.glow,
      fill: palette.fill,
      vectorEffect: 'non-scaling-stroke',
      cssVars,
    }
  }, [theme, tokens])
}
