import { chromium } from 'playwright'

const baseURL = process.env.WORKSPACE_PROFILE_URL ?? 'http://localhost:4173'
const timeoutMs = Number(process.env.WORKSPACE_PROFILE_TIMEOUT_MS ?? '20000')

const samples = []

const parsePerfLine = (line) => {
  const match = line.match(/\\[workspace-perf\\]\\s+(?<name>[a-z-]+)\\s+(?<duration>[0-9.]+)ms\\s+\\(<=\\s+(?<budget>[0-9.]+)ms\\)/)
  if (!match?.groups) return null
  return { name: match.groups.name, duration: Number(match.groups.duration), budgetMs: Number(match.groups.budget) }
}

const run = async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  page.on('console', (msg) => {
    const text = msg.text()
    const parsed = parsePerfLine(text)
    if (parsed) samples.push({ ...parsed, level: msg.type(), raw: text })
  })

  await page.goto(baseURL, { timeout: timeoutMs })
  await page.waitForSelector('.workspace-shell', { timeout: timeoutMs })

  await page.evaluate(() => {
    const api = (window).__APP_STORE__
    if (!api?.getState) throw new Error('Missing window.__APP_STORE__')
    const store = api.getState()

    store.reset()
    store.addSwitch()
    store.addGate('AND')
    store.addLight()

    const circuit = api.getState().circuit
    const sw = circuit.nodes.find((n) => n.type === 'switch')
    const gate = circuit.nodes.find((n) => n.type === 'gate')
    const light = circuit.nodes.find((n) => n.type === 'light')

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

    store.selectNodes([gate.id])
    store.toggleSwitch(sw.id)
    store.selectNodes([sw.id, gate.id])
  })

  await page.waitForTimeout(500)
  await browser.close()

  const byName = new Map()
  for (const sample of samples) {
    const list = byName.get(sample.name) ?? []
    list.push(sample)
    byName.set(sample.name, list)
  }

  const summary = [...byName.entries()].map(([name, list]) => {
    const durations = list.map((s) => s.duration).sort((a, b) => a - b)
    const p95 = durations.length ? durations[Math.floor(durations.length * 0.95)] : 0
    const max = durations.length ? durations[durations.length - 1] : 0
    return { name, count: list.length, p95: Number(p95.toFixed(2)), max: Number(max.toFixed(2)) }
  })

  console.log(JSON.stringify({ baseURL, summary, samples }, null, 2))
}

run().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

