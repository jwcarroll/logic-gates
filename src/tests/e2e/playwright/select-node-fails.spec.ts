import { expect, test } from '@playwright/test'

test.describe('Selection regression', () => {
  test('adds a gate and selects it via click', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')

    await page.getByRole('button', { name: /^AND gate$/ }).click()

    const nodeId = await page.evaluate(() => {
      const store = (window as any).__APP_STORE__
      const gate = store.getState().circuit.nodes.find((n: any) => n.type === 'gate')
      return gate?.id || null
    })

    expect(nodeId).not.toBeNull()

    // Attempt to select the node by clicking it in the canvas
    await page.locator(`[data-id="${nodeId}"]`).click({ force: true })

    expect(errors).toEqual([])
    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const store = (window as any).__APP_STORE__
          return store.getState().selectedNodeIds
        })
      })
      .toContain(nodeId)
  })
})
