import { expect, test } from '@playwright/test'

const SCROLL_TOLERANCE = 4

const assertNoBodyScrollbars = async (page: any) => {
  const { scrollHeight, clientHeight, scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollHeight - clientHeight).toBeLessThanOrEqual(SCROLL_TOLERANCE)
  expect(scrollWidth - clientWidth).toBeLessThanOrEqual(SCROLL_TOLERANCE)
}

test.describe('[US1] workspace layout', () => {
  test('canvas fills viewport and floating controls stay reachable', async ({ page }) => {
    await page.goto('/')

    const canvas = page.locator('.canvas-root')
    await expect(canvas).toBeVisible()

    const viewport = page.viewportSize()
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox?.width ?? 0).toBeGreaterThan((viewport?.width ?? 0) * 0.8)
    expect(canvasBox?.height ?? 0).toBeGreaterThan((viewport?.height ?? 0) * 0.75)

    await assertNoBodyScrollbars(page)

    // Anchored controls should be within viewport gutter and not overlap a selection region
    const anchors = page.locator('[data-testid="floating-anchor"]')
    await expect(anchors).toHaveCount(3)
    await expect(anchors.nth(0)).toBeVisible()
    await expect(anchors.nth(1)).toBeVisible()
    await expect(anchors.nth(2)).toBeVisible()
  })
})
