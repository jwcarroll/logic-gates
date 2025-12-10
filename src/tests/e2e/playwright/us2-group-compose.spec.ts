import { expect, test } from '@playwright/test'

test.describe('US2 grouping real browser flow', () => {
  test('groups gates, wires via ports, toggles outputs, and clones group', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /^Add switch$/ }).click()
    await page.getByRole('button', { name: /^Add switch$/ }).click()
    await page.getByRole('button', { name: /^AND gate$/ }).click()
    await page.getByRole('button', { name: /^Add light$/ }).click()
    await page.getByRole('button', { name: /^Add light$/ }).click()

    const ids = await page.evaluate(() => {
      const store = (window as any).__APP_STORE__
      const state = store.getState()
      const nodes = state.circuit.nodes
      const switches = nodes.filter((n: any) => n.type === 'switch').map((n: any) => ({ id: n.id, port: n.data.outputPortId }))
      const lights = nodes.filter((n: any) => n.type === 'light').map((n: any) => ({ id: n.id, port: n.data.inputPortId }))
      const andGate = nodes.find((n: any) => n.type === 'gate' && n.data.gateType === 'AND')
      return { switches, lights, andGate }
    })

    const { groupId, portMap } = await page.evaluate(({ andGate }) => {
      const store = (window as any).__APP_STORE__
      const result = store.getState().groupSelection('Group', [andGate.id])
      if (!result.ok) {
        throw new Error(`Grouping failed: ${result.errors?.join(', ')}`)
      }
      const group = store.getState().circuit.nodes.find((n: any) => n.type === 'group')
      return { groupId: group.id, portMap: group.data.portMap }
    }, ids)

    await page.evaluate(({ switches, lights, andGate, groupId, portMap }) => {
      const store = (window as any).__APP_STORE__
      const { connectWire } = store.getState()
      const groupInputs = Object.keys(portMap.inputs)
      const andOut = Object.entries(portMap.outputs).find(([, internal]) => internal === andGate.data.outputPortId)?.[0]

      connectWire({
        source: switches[0].id,
        target: groupId,
        sourceHandle: switches[0].port,
        targetHandle: groupInputs[0],
      })
      connectWire({
        source: switches[1].id,
        target: groupId,
        sourceHandle: switches[1].port,
        targetHandle: groupInputs[1],
      })
      connectWire({
        source: groupId,
        target: lights[0].id,
        sourceHandle: andOut,
        targetHandle: lights[0].port,
      })
    }, { ...ids, groupId, portMap })

    await page.evaluate(({ switches }) => {
      const store = (window as any).__APP_STORE__
      const { toggleSwitch } = store.getState()
      toggleSwitch(switches[0].id)
      toggleSwitch(switches[1].id)
    }, ids)

    await expect.poll(async () => {
      return await page.evaluate(() => {
        const store = (window as any).__APP_STORE__
        return store.getState().lights
      })
    }).toMatchObject({
      [ids.lights[0].id]: true,
    })

    await page.evaluate(({ groupId }) => {
      const store = (window as any).__APP_STORE__
      store.setState({ selectedNodeIds: [groupId] })
      const result = store.getState().cloneSelectedGroup()
      if (!result.ok) {
        throw new Error(`Clone failed: ${result.errors?.join(', ')}`)
      }
    }, { groupId })

    const groupCount = await page.evaluate(() => {
      const store = (window as any).__APP_STORE__
      return store.getState().circuit.nodes.filter((n: any) => n.type === 'group').length
    })
    expect(groupCount).toBe(2)
  })
})
