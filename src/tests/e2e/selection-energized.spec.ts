import { expect, test } from '@playwright/test'

test.describe('[US2] selection vs energized', () => {
  test('selection cues and energized wires are visible', async ({ page }) => {
    await page.goto('/')

    await page.waitForSelector('.workspace-shell', { timeout: 15000 })
    const canvas = page.locator('.canvas-root')
    await canvas.waitFor({ state: 'attached', timeout: 15000 })
    await canvas.waitFor({ state: 'visible', timeout: 15000 })
    await expect(canvas).toBeVisible()

    // selection vars should be attached to canvas root for styling
    const stroke = await canvas.evaluate((el) => getComputedStyle(el).getPropertyValue('--selection-stroke'))
    expect(stroke.trim().length).toBeGreaterThan(0)

    // energized overlay should exist (even if empty state)
    const overlay = page.locator('.energized-overlay')
    await overlay.waitFor({ state: 'attached', timeout: 8000 })
    await expect(overlay).toBeVisible()
  })
})
