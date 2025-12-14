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

export const getSelectionStyles = (theme: WorkspaceTheme = 'dark'): SelectionStyle => {
  const tokens = workspaceTokens.selection
  const palette = tokens.theme[theme]
  const cssVars: CSSProperties = {
    ['--selection-stroke' as string]: palette.stroke,
    ['--selection-fill' as string]: palette.fill,
    ['--selection-glow' as string]: palette.glow,
    ['--selection-handle' as string]: palette.handle,
    ['--selection-stroke-width' as string]: `${tokens.strokeWidth}px`,
    ['--selection-halo-width' as string]: `${tokens.haloWidth}px`,
  }
  return {
    stroke: palette.stroke,
    strokeWidth: tokens.strokeWidth,
    halo: palette.glow,
    fill: palette.fill,
    vectorEffect: 'non-scaling-stroke',
    cssVars,
  }
}

export const useSelectionStyles = (theme: WorkspaceTheme = 'dark'): SelectionStyle => {
  return useMemo(() => getSelectionStyles(theme), [theme])
}
