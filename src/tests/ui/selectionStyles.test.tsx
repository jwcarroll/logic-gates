import { describe, expect, it } from 'vitest'
import { useSelectionStyles } from '../../app/hooks/useSelectionStyles'
import { renderHook } from '@testing-library/react'
import { workspaceTokens } from '../../design/tokens/workspace'

describe('[US2] selection styles', () => {
  it('maps tokens to stroke and non-scaling outline', () => {
    const { result } = renderHook(() => useSelectionStyles('dark'))
    const { stroke, strokeWidth, vectorEffect, cssVars } = result.current
    expect(stroke).toBe(workspaceTokens.selection.theme.dark.stroke)
    expect(strokeWidth).toBe(workspaceTokens.selection.strokeWidth)
    expect(vectorEffect).toBe('non-scaling-stroke')
    expect(cssVars['--selection-stroke']).toBe(workspaceTokens.selection.theme.dark.stroke)
    expect(cssVars['--selection-glow']).toBe(workspaceTokens.selection.theme.dark.glow)
  })
})
