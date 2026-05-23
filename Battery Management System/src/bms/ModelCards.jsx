export function ModelCards({ ratings, consensusRemark }) {
  if (!ratings?.length) {
    return (
      <div className="bms-card">
        <p className="bms-empty">Waiting for MQTT data from ESP32 gateway…</p>
      </div>
    )
  }

  return (
    <>
      {consensusRemark && (
        <div className="bms-card" style={{ marginBottom: '1rem' }}>
          <h3>Summary</h3>
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.5 }}>{consensusRemark}</p>
        </div>
      )}
      <section className="bms-grid-3">
        {ratings.map((r) => (
          <article key={r.model_id} className="bms-card">
            <h3>{r.model_name}</h3>
            <div className={`bms-model-verdict ${r.verdict}`}>{r.verdict.toUpperCase()}</div>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.95rem', lineHeight: 1.45, color: 'var(--bms-text)' }}>
              {r.remark ?? `Good probability: ${r.score_pct}%`}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--bms-muted)', fontSize: '0.85rem' }}>
              Score: <strong style={{ color: 'var(--bms-text)' }}>{r.score_pct}%</strong> healthy
            </p>
            <div className="bms-score-track">
              <div className="bms-score-fill" style={{ width: `${r.score_pct}%` }} />
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
