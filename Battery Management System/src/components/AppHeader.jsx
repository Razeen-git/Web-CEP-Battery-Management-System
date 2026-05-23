import { useNavigate, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Map', path: '/dashboard' },
  { label: 'Battery Status', path: '/battery' },
  { label: 'Battery Health SOH', path: '/battery-ai' },
  { label: 'Wallet', path: '/wallet' },
]

function AppHeader({ title, titleAccent }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('rememberMe')
    navigate('/login')
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="header-title">
          {titleAccent ? (
            <>
              {title} <span>{titleAccent}</span>
            </>
          ) : (
            title
          )}
        </h1>
        <div className="header-actions">
          {NAV.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`btn-nav ${location.pathname === item.path ? 'btn-nav-primary' : 'btn-nav-ghost'}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
          <button type="button" className="btn-nav btn-nav-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
