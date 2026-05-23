import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_POINTS = 50

function wsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/ws`
}

function parseTelemetry(t) {
  const v = t.pack_voltage_v ?? t.voltage_v ?? 0
  const c = t.current_a ?? 0
  const s = t.soc_pct ?? t.soc ?? 0
  const soc = s > 1 ? s : s * 100
  return { voltage: +v.toFixed(2), current: +c.toFixed(2), soc: +soc.toFixed(1) }
}

function scoresFromRow(row) {
  const map = {}
  row.predictions?.ratings?.forEach((r) => {
    map[r.model_id] = r.score_pct
  })
  return {
    rf: map.random_forest ?? 0,
    gb: map.gradient_boosting ?? 0,
    et: map.extra_trees ?? map.logistic_regression ?? 0,
  }
}

export function useBmsStream() {
  const [latest, setLatest] = useState(null)
  const [chartData, setChartData] = useState([])
  const [health, setHealth] = useState(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  const pushRow = useCallback((row) => {
    setLatest(row)
    const { voltage, current, soc } = parseTelemetry(row.telemetry)
    const scores = scoresFromRow(row)
    const time = new Date(row.timestamp).toLocaleTimeString()
    setChartData((prev) => {
      const next = [...prev, { time, voltage, current, soc, ...scores }]
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next
    })
  }, [])

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const r = await fetch('/api/health')
        setHealth(await r.json())
      } catch {
        setHealth(null)
      }
    }
    loadHealth()
    const id = setInterval(loadHealth, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch('/api/history?limit=40')
      .then((r) => r.json())
      .then((d) => {
        ;(d.rows ?? []).forEach(pushRow)
      })
      .catch(() => {})

    let reconnectTimer

    const connect = () => {
      const ws = new WebSocket(wsUrl())
      wsRef.current = ws
      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        reconnectTimer = setTimeout(connect, 2500)
      }
      ws.onerror = () => ws.close()
      ws.onmessage = (ev) => {
        try {
          pushRow(JSON.parse(ev.data))
        } catch {
          /* ignore */
        }
      }
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [pushRow])

  return { latest, chartData, health, wsConnected: connected }
}
