import AppHeader from './AppHeader'
import GoogleMap from './GoogleMap'
import '../App.css'

function Dashboard() {
  return (
    <div className="app-shell">
      <AppHeader title="BMS" titleAccent="NAV" />
      <main className="app-main">
        <div className="map-section">
          <GoogleMap />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
