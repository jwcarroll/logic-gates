import { expect, test } from '@playwright/test'

test.describe('[US3] group drill-in', () => {
  test('open → edit → exit persists changes', async ({ page }) => {
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
      store.groupSelection('My Group', [a.id, b.id])
    })

    const groupNode = page.locator('.logic-node', { hasText: 'My Group' })
    await expect(groupNode).toBeVisible()
    await groupNode.dblclick()

    const breadcrumb = page.locator('.group-drill-in__breadcrumb')
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb).toContainText('My Group')

    await page.evaluate(() => {
      const api = (window as any).__APP_STORE__
      const state = api.getState()
      const groupId = state.openGroupId
      if (!groupId) throw new Error('Expected group to be open')
      const group = state.circuit.nodes.find((n: any) => n.type === 'group' && n.id === groupId)
      const childIds = group.data.childNodeIds
      const nodes = state.circuit.nodes
      const a = nodes.find((n: any) => n.id === childIds[0])
      const b = nodes.find((n: any) => n.id === childIds[1])
      const ok = state.connectWire({
        source: a.id,
        target: b.id,
        sourceHandle: a.data.outputPortId,
        targetHandle: b.data.inputPortIds[0],
      })
      if (!ok) throw new Error('Failed to connect internal wire')
    })

    await page.getByRole('button', { name: /back/i }).click()

    await page.evaluate(() => {
      const state = (window as any).__APP_STORE__.getState()
      if (state.openGroupId !== null) throw new Error('Expected group to be closed')
    })

    await expect(page.locator('.logic-node', { hasText: 'My Group' })).toBeVisible()
  })
})

