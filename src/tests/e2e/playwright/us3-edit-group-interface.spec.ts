import { expect, test } from '@playwright/test'

test.describe('US3 edit group interface', () => {
  test('edit warns, disconnects wires, and undo restores', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.canvas-root')

    await page.getByRole('button', { name: /^Add half-adder subcircuit$/ }).click()
    await page.getByRole('button', { name: /^Add switch$/ }).click()
    await page.getByRole('button', { name: /^Add switch$/ }).click()
    await page.getByRole('button', { name: /^Add light$/ }).click()
    await page.getByRole('button', { name: /^Add light$/ }).click()

    const ids = await page.evaluate(() => {
      const store = (window as any).__APP_STORE__
      const state = store.getState()
      const group = state.circuit.nodes.find((n: any) => n.type === 'group')
      const switches = state.circuit.nodes.filter((n: any) => n.type === 'switch')
      const lights = state.circuit.nodes.filter((n: any) => n.type === 'light')
      return {
        groupId: group.id,
        inA: group.data.interface.inputs[0].id,
        inB: group.data.interface.inputs[1].id,
        outSum: group.data.interface.outputs[0].id,
        outCarry: group.data.interface.outputs[1].id,
        swA: { id: switches[0].id, port: switches[0].data.outputPortId },
        swB: { id: switches[1].id, port: switches[1].data.outputPortId },
        sumLight: lights[0],
        carryLight: lights[1],
      }
    })

    await page.evaluate(
      ({ groupId, inA, inB, outSum, outCarry, swA, swB, sumLight, carryLight }) => {
        const store = (window as any).__APP_STORE__
        const { connectWire, selectNodes } = store.getState()
        connectWire({ source: swA.id, sourceHandle: swA.port, target: groupId, targetHandle: inA })
        connectWire({ source: swB.id, sourceHandle: swB.port, target: groupId, targetHandle: inB })
        connectWire({ source: groupId, sourceHandle: outSum, target: sumLight.id, targetHandle: sumLight.data.inputPortId })
        connectWire({ source: groupId, sourceHandle: outCarry, target: carryLight.id, targetHandle: carryLight.data.inputPortId })
        selectNodes([groupId])
      },
      ids,
    )

    await expect.poll(async () => {
      return await page.evaluate(({ groupId, swA, swB, sumLight, carryLight }) => {
        const state = (window as any).__APP_STORE__.getState()
        const external = new Set([groupId, swA.id, swB.id, sumLight.id, carryLight.id])
        return state.circuit.wires.filter((w: any) => external.has(w.sourceNode) || external.has(w.targetNode)).length
      }, ids)
    }).toBe(4)

    await page.getByRole('button', { name: /^Edit interface$/ }).click()
    await expect(page.getByRole('heading', { name: /edit group interface/i })).toBeVisible()

    // Change a port name to ensure the interface itself changes.
    const firstInputName = page.locator('.group-interface-editor__section').first().locator('input.toolbar-input').first()
    await firstInputName.fill('A2')

    await page.getByRole('button', { name: /^Update interface$/ }).click()
    await expect(page.getByRole('alert')).toContainText('disconnect')
    await expect(page.getByRole('alert')).toContainText('Rewiring required')

    await page.getByRole('button', { name: /^Disconnect wires and update$/ }).click()

    await expect.poll(async () => {
      return await page.evaluate(({ groupId, swA, swB, sumLight, carryLight }) => {
        const state = (window as any).__APP_STORE__.getState()
        const external = new Set([groupId, swA.id, swB.id, sumLight.id, carryLight.id])
        return state.circuit.wires.filter((w: any) => external.has(w.sourceNode) || external.has(w.targetNode)).length
      }, ids)
    }).toBe(0)

    await page.keyboard.press('Control+Z')

    await expect.poll(async () => {
      return await page.evaluate(({ groupId, swA, swB, sumLight, carryLight }) => {
        const state = (window as any).__APP_STORE__.getState()
        const group = state.circuit.nodes.find((n: any) => n.type === 'group' && n.id === groupId)
        const external = new Set([groupId, swA.id, swB.id, sumLight.id, carryLight.id])
        const wires = state.circuit.wires.filter((w: any) => external.has(w.sourceNode) || external.has(w.targetNode)).length
        return { wires, inputName: group.data.interface.inputs[0].name }
      }, ids)
    }).toEqual({ wires: 4, inputName: 'A' })
  })
})
