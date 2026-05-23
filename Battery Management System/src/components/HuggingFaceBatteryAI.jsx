import { useNavigate } from 'react-router-dom'
import { HF_EMBED_URL, HF_SPACE_URL, mainDashboardUrl } from '../config/links'
import './HuggingFaceBatteryAI.css'

function HuggingFaceBatteryAI() {
  const navigate = useNavigate()
  const dashboardUrl = mainDashboardUrl()

  return (
    <div className="hf-page">
      <header className="hf-top-bar">
        <button type="button" className="hf-btn back" onClick={() => navigate('/dashboard')}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Map
        </button>
        <h2>Battery AI (Hugging Face)</h2>
        <div className="hf-top-actions">
          <a className="hf-btn outline" href={HF_SPACE_URL} target="_blank" rel="noopener noreferrer">
            Open on Hugging Face
          </a>
          <button type="button" className="hf-btn outline" onClick={() => navigate('/battery-ai/live')}>
            Live MQTT
          </button>
        </div>
      </header>

      <p className="hf-note">
        Hosted demo:{' '}
        <a href={HF_SPACE_URL} target="_blank" rel="noopener noreferrer">{HF_SPACE_URL}</a>
        {' · '}
        Full app home: <a href={dashboardUrl}>{dashboardUrl}</a>
      </p>

      <iframe
        className="hf-embed"
        src={HF_EMBED_URL}
        title="Battery Health Classifier on Hugging Face"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

export default HuggingFaceBatteryAI
