import { expect, test } from '@playwright/test'

test.describe('[Phase 6] workspace usability validation', () => {
  test('SC-001–SC-003 signals exist (canvas, selection vars, energized edges)', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.workspace-shell', { timeout: 15000 })

    const canvas = page.locator('.canvas-root')
    await expect(canvas).toBeVisible()

    const viewport = page.viewportSize()
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox?.width ?? 0).toBeGreaterThanOrEqual((viewport?.width ?? 0) * 0.8)
    expect(canvasBox?.height ?? 0).toBeGreaterThanOrEqual((viewport?.height ?? 0) * 0.75)

    const stroke = await canvas.evaluate((el) => getComputedStyle(el).getPropertyValue('--selection-stroke'))
    expect(stroke.trim().length).toBeGreaterThan(0)

    await page.evaluate(() => {
      const api = (window as any).__APP_STORE__
      if (!api?.getState) throw new Error('Missing __APP_STORE__')
      const store = api.getState()

      store.reset()
      store.addSwitch()
      store.addGate('AND')
      store.addLight()
      const circuit = api.getState().circuit
      const sw = circuit.nodes.find((n: any) => n.type === 'switch')
      const gate = circuit.nodes.find((n: any) => n.type === 'gate')
      const light = circuit.nodes.find((n: any) => n.type === 'light')

      store.connectWire({
        source: sw.id,
        target: gate.id,
        sourceHandle: sw.data.outputPortId,
        targetHandle: gate.data.inputPortIds[0],
      })
      store.connectWire({
        source: gate.id,
        target: light.id,
        sourceHandle: gate.data.outputPortId,
        targetHandle: light.data.inputPortId,
      })
      store.toggleSwitch(sw.id)
    })

    const energizedEdges = page.locator('.react-flow__edge.workspace-wire.workspace-wire--energized')
    await expect(energizedEdges.first()).toBeVisible()
  })

  test('SC-004a group open-edit-return completes under 20s', async ({ page }) => {
    const start = Date.now()
    await page.goto('/')
    await page.waitForSelector('.workspace-shell', { timeout: 15000 })

    await page.evaluate(() => {
      const store = (window as any).__APP_STORE__?.getState?.()
      if (!store) throw new Error('Missing __APP_STORE__')
      store.reset()
      store.addGate('AND')
      store.addGate('XOR')
      const nodes = (window as any).__APP_STORE__.getState().circuit.nodes
      const a = nodes.find((n: any) => n.type === 'gate' && n.data.gateType === 'AND')
      const b = nodes.find((n: any) => n.type === 'gate' && n.data.gateType === 'XOR')
      store.selectNodes([a.id, b.id])
      store.groupSelection('Perf Group', [a.id, b.id])

      const confirm = store.confirmGroupInterfaceDraft()
      if (!confirm.ok) throw new Error(`Confirm group failed: ${(confirm.errors || []).join(', ')}`)
    })

    await page.locator('.logic-node', { hasText: 'Perf Group' }).dblclick()
    await expect(page.locator('.group-drill-in__breadcrumb')).toContainText('Perf Group')

    await page.evaluate(() => {
      const api = (window as any).__APP_STORE__
      const state = api.getState()
      const groupId = state.openGroupId
      const group = state.circuit.nodes.find((n: any) => n.type === 'group' && n.id === groupId)
      const childIds = group.data.childNodeIds
      const nodes = state.circuit.nodes
      const children = nodes.filter((n: any) => childIds.includes(n.id))
      const gate = children.find((n: any) => n.type === 'gate')
      if (!gate) throw new Error('Expected a gate node inside the group')
      state.moveNodes([
        {
          id: gate.id,
          type: 'position',
          position: { x: gate.position.x + 10, y: gate.position.y + 10 },
        },
      ])
    })

    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.locator('.logic-node', { hasText: 'Perf Group' })).toBeVisible()

    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(20_000)
  })
})
