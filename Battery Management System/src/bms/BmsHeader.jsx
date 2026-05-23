export function BmsHeader({ mode = 'local', health, wsConnected, consensus }) {
  const mqtt = health?.mqtt
  const mqttOk = mqtt?.connected

  if (mode === 'cloud') {
    return (
      <header className="bms-panel-header">
        <div>
          <h1>State of Health Monitor</h1>
          <p>Cloud inference · Hugging Face Space · Models loaded remotely</p>
        </div>
        <div className="bms-badges">
          <span className="bms-badge live">● Cloud connected</span>
          <span className="bms-badge good">Classifier ready</span>
        </div>
      </header>
    )
  }

  const mqttLabel = mqttOk
    ? `MQTT connected (${mqtt?.messages_received ?? 0} msgs)`
    : mqtt?.error
      ? `MQTT: ${mqtt.error}`
      : 'MQTT waiting…'

  return (
    <header className="bms-panel-header">
      <div>
        <h1>State of Health Monitor</h1>
        <p>
          Topic: <code>{mqtt?.topic ?? '—'}</code> · User: {mqtt?.username ?? '—'}
        </p>
      </div>
      <div className="bms-badges">
        <span className={`bms-badge ${wsConnected ? 'live' : 'off'}`}>
          {wsConnected ? '● WebSocket live' : '○ WebSocket reconnecting…'}
        </span>
        <span className={`bms-badge ${mqttOk ? 'good' : mqtt?.error ? 'bad' : 'off'}`}>
          {mqttLabel}
        </span>
        {consensus && (
          <span className={`bms-badge ${consensus === 'good' ? 'good' : 'bad'}`}>
            Consensus: {consensus.toUpperCase()}
          </span>
        )}
      </div>
    </header>
  )
}
