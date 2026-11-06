import { useState } from 'react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const DOWNLOAD_BYTES = 10 * 1024 * 1024
const UPLOAD_BYTES = 5 * 1024 * 1024
const PING_SAMPLES = 5

const initialResults = { download: null, upload: null, ping: null, jitter: null }

function toMbps(bytes, milliseconds) {
  return (bytes * 8) / (milliseconds / 1000) / 1_000_000
}

function formatSpeed(value) {
  if (value === null) return '—'
  return value < 10 ? value.toFixed(2) : value.toFixed(1)
}

function App() {
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState('Ready to test your connection')
  const [results, setResults] = useState(initialResults)
  const [error, setError] = useState('')
  const [finishedAt, setFinishedAt] = useState(null)

  async function runTest() {
    setRunning(true)
    setError('')
    setFinishedAt(null)
    setResults(initialResults)

    try {
      setStage('Measuring download speed…')
      const downloadUrl = new URL(`${API_URL}/speedtest/download`)
      downloadUrl.searchParams.set('bytes', String(DOWNLOAD_BYTES))
      downloadUrl.searchParams.set('t', String(Date.now()))
      const downloadStart = performance.now()
      const downloadResponse = await fetch(downloadUrl, { cache: 'no-store' })
      if (!downloadResponse.ok) throw new Error(`Download test failed (${downloadResponse.status}).`)
      const downloaded = await downloadResponse.arrayBuffer()
      const downloadElapsed = performance.now() - downloadStart
      const download = toMbps(downloaded.byteLength, downloadElapsed)
      setResults((current) => ({ ...current, download }))

      setStage('Measuring upload speed…')
      const uploadPayload = new Uint8Array(UPLOAD_BYTES)
      const uploadStart = performance.now()
      const uploadResponse = await fetch(`${API_URL}/speedtest/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: uploadPayload,
        cache: 'no-store',
      })
      const uploadElapsed = performance.now() - uploadStart
      if (!uploadResponse.ok) throw new Error(`Upload test failed (${uploadResponse.status}).`)
      const uploadResult = await uploadResponse.json()
      const upload = toMbps(uploadResult.bytesReceived, uploadElapsed)
      setResults((current) => ({ ...current, upload }))

      setStage('Measuring latency and jitter…')
      const latencies = []
      for (let i = 0; i < PING_SAMPLES; i += 1) {
        const pingUrl = new URL(`${API_URL}/speedtest/ping`)
        pingUrl.searchParams.set('t', `${Date.now()}-${i}`)
        const pingStart = performance.now()
        const pingResponse = await fetch(pingUrl, { cache: 'no-store' })
        if (!pingResponse.ok) throw new Error(`Ping test failed (${pingResponse.status}).`)
        await pingResponse.json()
        latencies.push(performance.now() - pingStart)
      }
      const ping = latencies.reduce((sum, value) => sum + value, 0) / latencies.length
      const jitter = latencies.slice(1).reduce((sum, value, index) => sum + Math.abs(value - latencies[index]), 0) / (latencies.length - 1)
      setResults((current) => ({ ...current, ping, jitter }))
      setStage('Test complete')
      setFinishedAt(new Date())
    } catch (testError) {
      setStage('Test could not be completed')
      setError(`${testError.message} Check that the API is running at ${API_URL}.`)
    } finally {
      setRunning(false)
    }
  }

  const hasResults = results.download !== null

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b12] px-5 py-8 text-slate-100 sm:px-8 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-600/15 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-[130px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between">
          <a className="flex items-center gap-3 text-sm font-semibold tracking-wide text-white" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-indigo-300">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M3.5 9.5a12.5 12.5 0 0 1 17 0M6.8 13a7.6 7.6 0 0 1 10.4 0m-7.1 3.5a2.8 2.8 0 0 1 3.8 0M12 20h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </span>
            SKIRILL <span className="font-normal text-slate-500">/ SPEED TEST</span>
          </a>
          <span className="hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-200 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" /> Browser-based test
          </span>
        </header>

        <section className="mx-auto flex w-full flex-1 flex-col items-center justify-center py-14 text-center sm:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-1.5 text-xs text-slate-400">
            <span className={`h-1.5 w-1.5 rounded-full ${running ? 'animate-pulse bg-indigo-300' : hasResults ? 'bg-emerald-300' : 'bg-slate-500'}`} />
            {stage}
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">How fast is your internet?</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">A quick check of the connection between this device and our test server.</p>

          <div className="relative my-10 flex h-52 w-52 items-center justify-center sm:my-12 sm:h-60 sm:w-60">
            <div className="absolute inset-0 rounded-full border border-white/[0.08]" />
            <div className="absolute inset-3 rounded-full border border-white/[0.06]" />
            {running && <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-indigo-300" />}
            <div className="absolute inset-7 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="relative flex flex-col items-center">
              <span className="text-6xl font-semibold tabular-nums tracking-[-0.06em] text-white sm:text-7xl">{formatSpeed(results.download)}</span>
              <span className="mt-1 text-sm font-medium tracking-[0.22em] text-slate-400">{hasResults ? 'Mbps DOWNLOAD' : 'Mbps'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={runTest}
            disabled={running}
            className="group inline-flex min-w-48 items-center justify-center gap-2 rounded-full bg-indigo-400 px-8 py-3.5 text-sm font-semibold text-[#101020] shadow-[0_8px_32px_rgba(129,120,255,0.2)] transition hover:bg-indigo-300 hover:shadow-[0_8px_40px_rgba(129,120,255,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300 disabled:cursor-wait disabled:opacity-70"
          >
            {running ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#101020]/30 border-t-[#101020]" /> Testing…</> : hasResults ? 'Test again' : 'Go'}
          </button>

          {error && <p role="alert" className="mt-5 max-w-lg rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-200">{error}</p>}
          {finishedAt && <p className="mt-4 text-sm text-slate-300">Your internet speed is <span className="font-semibold text-white">{formatSpeed(results.download)} Mbps</span><span className="ml-2 text-xs text-slate-500">· {finishedAt.toLocaleTimeString()}</span></p>}
        </section>

        <section aria-label="Connection results" className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.035] backdrop-blur sm:grid-cols-4">
          <Metric label="Download" value={results.download === null ? '—' : formatSpeed(results.download)} unit="Mbps" accent="text-indigo-300" />
          <Metric label="Upload" value={results.upload === null ? '—' : formatSpeed(results.upload)} unit="Mbps" accent="text-cyan-300" />
          <Metric label="Latency" value={results.ping === null ? '—' : results.ping.toFixed(0)} unit="ms" accent="text-violet-300" />
          <Metric label="Jitter" value={results.jitter === null ? '—' : results.jitter.toFixed(1)} unit="ms" accent="text-fuchsia-300" />
        </section>

        <footer className="flex flex-col gap-2 py-6 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>Your results are measured in this browser and are not stored.</span>
          <span>Speed can vary with your distance from the test server.</span>
        </footer>
      </div>
    </main>
  )
}

function Metric({ label, value, unit, accent }) {
  return (
    <div className="border-b border-r border-white/[0.07] px-4 py-5 text-center last:border-r-0 sm:border-b-0 sm:px-6 sm:py-6">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl ${accent}`}>{value}<span className="ml-1.5 text-xs font-medium text-slate-500">{unit}</span></p>
    </div>
  )
}

export default App
