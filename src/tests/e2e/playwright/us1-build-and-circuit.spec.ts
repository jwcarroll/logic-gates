import { expect, test } from '@playwright/test'

test.describe('US1 real browser flow', () => {
  test('builds AND circuit via UI and reflects output without runtime errors', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => {
      pageErrors.push(err.message)
    })

    await page.goto('/')
    await page.waitForSelector('.canvas-root')
    await page.getByRole('button', { name: /^Add switch$/ }).click()
    await page.getByRole('button', { name: /^Add switch$/ }).click()
    await page.getByRole('button', { name: /^AND gate$/ }).click()
    await page.getByRole('button', { name: /^Add light$/ }).click()

    const { switches, gate, light } = await page.evaluate(() => {
      const store = (window as any).__APP_STORE__
      const state = store.getState()
      const nodes = state.circuit.nodes
      return {
        switches: nodes.filter((n: any) => n.type === 'switch').map((n: any) => ({ id: n.id, port: n.data.outputPortId })),
        gate: nodes.find((n: any) => n.type === 'gate'),
        light: nodes.find((n: any) => n.type === 'light'),
      }
    })

    await page.evaluate(
      ({ switches, gate, light }) => {
        const store = (window as any).__APP_STORE__
        const { connectWire, toggleSwitch } = store.getState()
        connectWire({
          source: switches[0].id,
          target: gate.id,
          sourceHandle: switches[0].port,
          targetHandle: gate.data.inputPortIds[0],
        })
        connectWire({
          source: switches[1].id,
          target: gate.id,
          sourceHandle: switches[1].port,
          targetHandle: gate.data.inputPortIds[1],
        })
        connectWire({
          source: gate.id,
          target: light.id,
          sourceHandle: gate.data.outputPortId,
          targetHandle: light.data.inputPortId,
        })
        toggleSwitch(switches[0].id)
        toggleSwitch(switches[1].id)
      },
      { switches, gate, light },
    )

    // Click a rendered node to surface any runtime errors surfaced by React Flow/UI handlers
    const firstNodeId = await page.evaluate(() => {
      const store = (window as any).__APP_STORE__
      const nodes = store.getState().circuit.nodes
      return nodes[0]?.id
    })
    if (!firstNodeId) throw new Error('No nodes found on canvas')
    await page.locator(`[data-id="${firstNodeId}"]`).click()
    await page.waitForTimeout(50)

    await expect.poll(async () => {
      return await page.evaluate((lightId) => {
        const store = (window as any).__APP_STORE__
        return store.getState().lights[lightId]
      }, light.id)
    }).toBe(true)

    const fallbackVisible = await page.locator('[data-testid="app-error-fallback"]').isVisible().catch(() => false)

    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])
    expect(fallbackVisible).toBe(false)
  })
})
