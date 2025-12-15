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

    const { groupId, inputs, outputs } = await page.evaluate(({ andGate }) => {
      const store = (window as any).__APP_STORE__
      const start = store.getState().groupSelection('Group', [andGate.id])
      if (!start.ok) throw new Error(`Grouping failed: ${start.errors?.join(', ')}`)
      const confirm = store.getState().confirmGroupInterfaceDraft()
      if (!confirm.ok) throw new Error(`Confirm failed: ${confirm.errors?.join(', ')}`)
      const group = store.getState().circuit.nodes.find((n: any) => n.type === 'group')
      return {
        groupId: group.id,
        inputs: group.data.interface.inputs.map((p: any) => p.id),
        outputs: group.data.interface.outputs.map((p: any) => p.id),
      }
    }, ids)

    await page.evaluate(({ switches, lights, groupId, inputs, outputs }) => {
      const store = (window as any).__APP_STORE__
      const { connectWire } = store.getState()

      connectWire({
        source: switches[0].id,
        target: groupId,
        sourceHandle: switches[0].port,
        targetHandle: inputs[0],
      })
      connectWire({
        source: switches[1].id,
        target: groupId,
        sourceHandle: switches[1].port,
        targetHandle: inputs[1],
      })
      connectWire({
        source: groupId,
        target: lights[0].id,
        sourceHandle: outputs[0],
        targetHandle: lights[0].port,
      })
    }, { ...ids, groupId, inputs, outputs })

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
