function fmt(n, digits = 1) {
  if (n === undefined || Number.isNaN(n)) return '—'
  return n.toFixed(digits)
}

export function TelemetryPanel({ telemetry, timestamp }) {
  if (!telemetry) {
    return (
      <div className="bms-card">
        <h3>Live telemetry</h3>
        <p className="bms-empty">No data yet</p>
      </div>
    )
  }

  const v = telemetry.pack_voltage_v ?? telemetry.voltage_v
  const soc = telemetry.soc_pct ?? telemetry.soc
  const socPct = soc !== undefined ? (soc > 1 ? soc : soc * 100) : undefined

  return (
    <div className="bms-card">
      <h3>
        Live telemetry
        {timestamp && (
          <span style={{ fontWeight: 400 }}> · {new Date(timestamp).toLocaleTimeString()}</span>
        )}
      </h3>
      <div className="bms-metrics">
        <div className="bms-metric">
          <div className="val">{fmt(v, 2)}</div>
          <div className="lbl">Pack V</div>
        </div>
        <div className="bms-metric">
          <div className="val">{fmt(telemetry.current_a, 1)}</div>
          <div className="lbl">Current A</div>
        </div>
        <div className="bms-metric">
          <div className="val">{socPct !== undefined ? Math.round(socPct) : '—'}</div>
          <div className="lbl">SOC %</div>
        </div>
        <div className="bms-metric">
          <div className="val">{fmt(telemetry.power_w, 0)}</div>
          <div className="lbl">Power W</div>
        </div>
        <div className="bms-metric">
          <div className="val">{telemetry.cell_diff_mv ?? '—'}</div>
          <div className="lbl">Cell diff mV</div>
        </div>
        <div className="bms-metric">
          <div className="val">{telemetry.max_temp_c ?? '—'}</div>
          <div className="lbl">Max °C</div>
        </div>
        <div className="bms-metric">
          <div className="val">{telemetry.alarm_flags ?? 0}</div>
          <div className="lbl">Alarms</div>
        </div>
      </div>
      {telemetry.cells && telemetry.cells.length > 0 && (
        <>
          <p style={{ margin: '1rem 0 0.35rem', fontSize: '0.75rem', color: 'var(--bms-muted)' }}>
            Cell voltages (V)
          </p>
          <div className="bms-cells-list">
            {telemetry.cells.map((c, i) => (
              <span key={i} className="bms-cell-pill">
                #{c.n ?? i + 1} {typeof c.v === 'number' ? c.v.toFixed(3) : '—'}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
