import { useEffect, useState } from 'react'
import { BmsHeader } from '../bms/BmsHeader'
import { LiveCharts } from '../bms/LiveCharts'
import { ModelCards } from '../bms/ModelCards'
import { TelemetryPanel } from '../bms/TelemetryPanel'
import { useBmsStream } from '../bms/useBmsStream'
import { HF_EMBED_URL, HF_SPACE_URL } from '../config/links'
import AppHeader from './AppHeader'
import './BmsClassifier.css'

function BmsClassifier() {
  const { latest, chartData, health, wsConnected } = useBmsStream()
  const consensus = latest?.predictions?.consensus?.verdict

  const [source, setSource] = useState('cloud') // cloud | local
  const [embedSrc] = useState(HF_EMBED_URL)

  const localApiUp = health?.ok === true
  const localLive =
    localApiUp &&
    (wsConnected || health?.mqtt?.connected || chartData.length > 0 || !!latest?.telemetry)

  useEffect(() => {
    let cancelled = false

    const preferCloud = () => {
      if (!cancelled) setSource('cloud')
    }

    const timer = setTimeout(preferCloud, 2000)

    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((h) => {
        if (cancelled || !h?.ok) return
        clearTimeout(timer)
        if (h.models_ready && (h.mqtt?.connected || wsConnected)) {
          setSource('local')
        } else {
          setSource('cloud')
        }
      })
      .catch(preferCloud)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [wsConnected])

  useEffect(() => {
    if (localLive && source === 'cloud') {
      setSource('local')
    }
  }, [localLive, source])

  const showLocal = source === 'local' && localApiUp

  return (
    <div className="bms-page">
      <AppHeader title="Battery" titleAccent="Health SOH" />

      <div className="bms-app">
        <div className="bms-source-bar">
          <div className="bms-source-tabs">
            <button
              type="button"
              className={`bms-source-tab ${!showLocal ? 'active' : ''}`}
              onClick={() => setSource('cloud')}
            >
              Cloud classifier
            </button>
            <button
              type="button"
              className={`bms-source-tab ${showLocal ? 'active' : ''}`}
              onClick={() => setSource('local')}
              disabled={!localApiUp}
              title={!localApiUp ? 'Start npm run dev (Python API on port 8080)' : undefined}
            >
              Live MQTT
            </button>
          </div>
          <span className={`bms-source-pill ${showLocal ? 'local' : 'cloud'}`}>
            {showLocal ? '● Local stream' : '● Hugging Face cloud'}
          </span>
        </div>

        {!showLocal ? (
          <div className="bms-cloud-panel">
            <BmsHeader
              mode="cloud"
              health={health}
              wsConnected={false}
              consensus={consensus}
            />
            <p className="bms-cloud-note">
              Classifier runs on Hugging Face — same models as your Space.{' '}
              <a href={HF_SPACE_URL} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </p>
            <iframe
              className="bms-hf-embed"
              src={embedSrc}
              title="Battery Health Classifier"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {!localApiUp && (
              <p className="bms-hint bms-hint-inline">
                For ESP32 / MQTT live charts, run <code>npm run dev</code> (starts website + API), then switch to
                Live MQTT.
              </p>
            )}
          </div>
        ) : (
          <>
            <BmsHeader
              mode="local"
              health={health}
              wsConnected={wsConnected}
              consensus={consensus}
            />
            <ModelCards
              ratings={latest?.predictions?.ratings}
              consensusRemark={latest?.predictions?.consensus?.remark}
            />
            <LiveCharts data={chartData} />
            <section className="bms-grid-2">
              <TelemetryPanel telemetry={latest?.telemetry} timestamp={latest?.timestamp} />
              <div className="bms-card">
                <h3>Connection</h3>
                <div className="bms-metrics">
                  <div className="bms-metric">
                    <div className="val" style={{ fontSize: '0.85rem' }}>
                      {health?.mqtt?.broker?.slice(0, 12) ?? '—'}…
                    </div>
                    <div className="lbl">MQTT broker</div>
                  </div>
                  <div className="bms-metric">
                    <div className="val" style={{ fontSize: '0.9rem' }}>{health?.mqtt?.topic ?? '—'}</div>
                    <div className="lbl">Topic</div>
                  </div>
                  <div className="bms-metric">
                    <div className="val">{health?.models_ready ? 'OK' : '—'}</div>
                    <div className="lbl">Models</div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default BmsClassifier
