import { expect, test } from '@playwright/test'

test.describe('US1 custom group interface', () => {
  test('groups half-adder gates into a 2-in/2-out interface and preserves truth table', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.canvas-root')

    // Build: 2 switches, XOR+AND, 2 lights.
    await page.getByRole('button', { name: /^Add switch$/ }).click()
    await page.getByRole('button', { name: /^Add switch$/ }).click()
    await page.getByRole('button', { name: /^XOR gate$/ }).click()
    await page.getByRole('button', { name: /^AND gate$/ }).click()
    await page.getByRole('button', { name: /^Add light$/ }).click()
    await page.getByRole('button', { name: /^Add light$/ }).click()

    const ids = await page.evaluate(() => {
      const store = (window as any).__APP_STORE__
      const state = store.getState()
      const nodes = state.circuit.nodes
      const switches = nodes.filter((n: any) => n.type === 'switch')
      const xorGate = nodes.find((n: any) => n.type === 'gate' && n.data.gateType === 'XOR')
      const andGate = nodes.find((n: any) => n.type === 'gate' && n.data.gateType === 'AND')
      const lights = nodes.filter((n: any) => n.type === 'light')
      return {
        swA: { id: switches[0].id, port: switches[0].data.outputPortId },
        swB: { id: switches[1].id, port: switches[1].data.outputPortId },
        xor: xorGate,
        and: andGate,
        sumLight: lights[0],
        carryLight: lights[1],
      }
    })

    await page.evaluate(
      ({ swA, swB, xor, and, sumLight, carryLight }) => {
        const store = (window as any).__APP_STORE__
        const { connectWire } = store.getState()

        // A feeds XOR.in0 + AND.in0
        connectWire({ source: swA.id, target: xor.id, sourceHandle: swA.port, targetHandle: xor.data.inputPortIds[0] })
        connectWire({ source: swA.id, target: and.id, sourceHandle: swA.port, targetHandle: and.data.inputPortIds[0] })
        // B feeds XOR.in1 + AND.in1
        connectWire({ source: swB.id, target: xor.id, sourceHandle: swB.port, targetHandle: xor.data.inputPortIds[1] })
        connectWire({ source: swB.id, target: and.id, sourceHandle: swB.port, targetHandle: and.data.inputPortIds[1] })
        // Outputs
        connectWire({ source: xor.id, target: sumLight.id, sourceHandle: xor.data.outputPortId, targetHandle: sumLight.data.inputPortId })
        connectWire({ source: and.id, target: carryLight.id, sourceHandle: and.data.outputPortId, targetHandle: carryLight.data.inputPortId })
      },
      ids,
    )

    // Start grouping flow.
    await page.evaluate(
      ({ xor, and }) => {
        const store = (window as any).__APP_STORE__
        const { selectNodes, groupSelection } = store.getState()
        selectNodes([xor.id, and.id])
        groupSelection('Half Adder', [xor.id, and.id])
      },
      { xor: ids.xor, and: ids.and },
    )

    // Shape the draft interface to 2 inputs and 2 outputs, and name them.
    await page.evaluate(() => {
      const store = (window as any).__APP_STORE__
      const state = store.getState()
      const draft = state.groupInterfaceDraft
      if (!draft) throw new Error('Expected active group interface draft')

      const nextInputs = draft.interfaceDraft.inputs.slice(0, 2).map((p: any, idx: number) => ({
        ...p,
        name: idx === 0 ? 'A' : 'B',
      }))
      const nextOutputs = draft.interfaceDraft.outputs.slice(0, 2).map((p: any, idx: number) => ({
        ...p,
        name: idx === 0 ? 'SUM' : 'CARRY',
      }))

      store.setState({
        groupInterfaceDraft: {
          ...draft,
          interfaceDraft: { inputs: nextInputs, outputs: nextOutputs },
          errors: [],
        },
      })

      const confirm = store.getState().confirmGroupInterfaceDraft()
      if (!confirm.ok) throw new Error(`Confirm failed: ${(confirm.errors || []).join(', ')}`)
    })

    const groupInfo = await page.evaluate(() => {
      const store = (window as any).__APP_STORE__
      const group = store.getState().circuit.nodes.find((n: any) => n.type === 'group')
      return {
        groupId: group.id,
        inputs: group.data.interface.inputs.map((p: any) => p.name),
        outputs: group.data.interface.outputs.map((p: any) => p.name),
      }
    })
    expect(groupInfo.inputs).toEqual(['A', 'B'])
    expect(groupInfo.outputs).toEqual(['SUM', 'CARRY'])

    const cases: Array<{ a: boolean; b: boolean; sum: boolean; carry: boolean }> = [
      { a: false, b: false, sum: false, carry: false },
      { a: false, b: true, sum: true, carry: false },
      { a: true, b: false, sum: true, carry: false },
      { a: true, b: true, sum: false, carry: true },
    ]

    for (const c of cases) {
      await page.evaluate(
        ({ a, b, swAId, swBId }) => {
          const store = (window as any).__APP_STORE__
          const state = store.getState()
          const nodes = state.circuit.nodes
          const swA = nodes.find((n: any) => n.id === swAId)
          const swB = nodes.find((n: any) => n.id === swBId)
          if (!swA || !swB) throw new Error('Missing switches')
          const toggle = store.getState().toggleSwitch
          if (Boolean(swA.data.state) !== a) toggle(swAId)
          if (Boolean(swB.data.state) !== b) toggle(swBId)
        },
        { a: c.a, b: c.b, swAId: ids.swA.id, swBId: ids.swB.id },
      )

      await expect.poll(async () => {
        return await page.evaluate(({ sumId, carryId }) => {
          const store = (window as any).__APP_STORE__
          const s = store.getState()
          return { sum: Boolean(s.lights[sumId]), carry: Boolean(s.lights[carryId]) }
        }, { sumId: ids.sumLight.id, carryId: ids.carryLight.id })
      }).toEqual({ sum: c.sum, carry: c.carry })
    }
  })
})
