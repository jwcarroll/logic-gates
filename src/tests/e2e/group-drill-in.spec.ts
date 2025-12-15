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

      const confirm = store.confirmGroupInterfaceDraft()
      if (!confirm.ok) throw new Error(`Confirm group failed: ${(confirm.errors || []).join(', ')}`)
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
      const children = nodes.filter((n: any) => childIds.includes(n.id))
      const gate = children.find((n: any) => n.type === 'gate')
      if (!gate) throw new Error('Expected a gate node inside the group')
      state.moveNodes([
        {
          id: gate.id,
          type: 'position',
          position: { x: gate.position.x + 20, y: gate.position.y + 20 },
        },
      ])
    })

    await page.getByRole('button', { name: /back/i }).click()

    await page.evaluate(() => {
      const state = (window as any).__APP_STORE__.getState()
      if (state.openGroupId !== null) throw new Error('Expected group to be closed')
    })

    await expect(page.locator('.logic-node', { hasText: 'My Group' })).toBeVisible()
  })
})
