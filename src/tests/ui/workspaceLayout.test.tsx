import { describe, expect, it } from 'vitest'
import { workspaceTokens } from '../../design/tokens/workspace'
import { computeAnchorPosition } from '../../ui/workspace/anchorMath'

const viewport = { width: 1440, height: 900 }
const selectionBox = { x: 1320, y: 16, width: 140, height: 160 }

describe('[US1] workspace layout + floating anchors', () => {
  it('shifts anchor 12–24px away from selection when colliding', () => {
    const anchor = {
      position: 'top-right' as const,
      offset: { x: 16, y: 16 },
      size: { width: 120, height: 48 },
    }

    const result = computeAnchorPosition(anchor, selectionBox, viewport)
    const { collisionShift } = workspaceTokens.anchors

    expect(result.repositioned).toBe(true)
    expect(result.shift).toBeGreaterThanOrEqual(collisionShift.min)
    expect(result.shift).toBeLessThanOrEqual(collisionShift.max)
    expect(result.position).toBe('top-right')
  })

  it('falls back to top-left when top-right still overlaps selection', () => {
    const anchor = {
      position: 'top-right' as const,
      offset: { x: 16, y: 16 },
      size: { width: 200, height: 200 },
    }

    const result = computeAnchorPosition(anchor, selectionBox, viewport)
    expect(result.attemptedPositions[0]).toBe('top-right')
    expect(result.attemptedPositions).toContain('top-left')
  })
})
