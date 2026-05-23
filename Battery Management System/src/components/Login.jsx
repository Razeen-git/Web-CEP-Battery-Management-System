import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Dummy credentials
  const DUMMY_CREDENTIALS = {
    email: 'admin@dashboard.com',
    password: 'admin123'
  }

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const fillDummyCredentials = () => {
    setFormData({
      email: DUMMY_CREDENTIALS.email,
      password: DUMMY_CREDENTIALS.password
    })
    setErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    // Check credentials
    if (formData.email && formData.password) {
      if (formData.email !== DUMMY_CREDENTIALS.email || formData.password !== DUMMY_CREDENTIALS.password) {
        newErrors.general = 'Invalid email or password'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Store auth state (in real app, use proper auth system)
      localStorage.setItem('isAuthenticated', 'true')
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      // Dispatch custom event to notify App component
      window.dispatchEvent(new Event('authStateChanged'))
      navigate('/dashboard')
    }, 1500)
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="logo-circle">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 0L24.49 15.51L40 20L24.49 24.49L20 40L15.51 24.49L0 20L15.51 15.51L20 0Z" fill="url(#gradient)"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40">
                  <stop offset="0%" stopColor="#667eea"/>
                  <stop offset="100%" stopColor="#764ba2"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue to your dashboard</p>
        </div>

        <div className="dummy-credentials">
          <div className="dummy-header">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 1.66667C5.4 1.66667 1.66667 5.4 1.66667 10C1.66667 14.6 5.4 18.3333 10 18.3333C14.6 18.3333 18.3333 14.6 18.3333 10C18.3333 5.4 14.6 1.66667 10 1.66667ZM10 16.6667C6.325 16.6667 3.33333 13.675 3.33333 10C3.33333 6.325 6.325 3.33333 10 3.33333C13.675 3.33333 16.6667 6.325 16.6667 10C16.6667 13.675 13.675 16.6667 10 16.6667ZM9.16667 13.3333H10.8333V11.6667H9.16667V13.3333ZM9.16667 10H10.8333V5.83333H9.16667V10Z" fill="currentColor"/>
            </svg>
            <span>Demo Credentials</span>
          </div>
          <div className="dummy-info">
            <div className="dummy-item">
              <strong>Email:</strong> {DUMMY_CREDENTIALS.email}
            </div>
            <div className="dummy-item">
              <strong>Password:</strong> {DUMMY_CREDENTIALS.password}
            </div>
          </div>
          <button type="button" className="fill-credentials-btn" onClick={fillDummyCredentials}>
            Fill Credentials
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && <div className="error-message-general">{errors.general}</div>}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 6.66667L10 11.6667L17.5 6.66667M3.33333 15H16.6667C17.5871 15 18.3333 14.2538 18.3333 13.3333V6.66667C18.3333 5.74619 17.5871 5 16.6667 5H3.33333C2.41286 5 1.66667 5.74619 1.66667 6.66667V13.3333C1.66667 14.2538 2.41286 15 3.33333 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15.8333 9.16667V5.83333C15.8333 3.53215 13.9679 1.66667 11.6667 1.66667H8.33333C6.03215 1.66667 4.16667 3.53215 4.16667 5.83333V9.16667M10 14.5833V16.25M5.83333 9.16667H14.1667C15.0871 9.16667 15.8333 9.91286 15.8333 10.8333V15.8333C15.8333 16.7538 15.0871 17.5 14.1667 17.5H5.83333C4.91286 17.5 4.16667 16.7538 4.16667 15.8333V10.8333C4.16667 9.91286 4.91286 9.16667 5.83333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M2.5 2.5L17.5 17.5M8.33333 8.33333C7.89131 8.77535 7.5 9.44102 7.5 10.4167C7.5 12.1756 8.99112 13.6667 10.75 13.6667C11.7257 13.6667 12.3913 13.2754 12.8333 12.8333M5.20833 5.20833C3.925 6.25 2.91667 7.5 1.66667 10.4167C3.33333 14.1667 6.66667 16.6667 10 16.6667C11.4167 16.6667 12.6667 16.25 13.7917 15.625M13.3333 10.4167C13.3333 8.65777 11.8422 7.16667 10.0833 7.16667L12.5 9.58333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M1.66667 10.4167C1.66667 10.4167 4.16667 5.83333 10 5.83333C15.8333 5.83333 18.3333 10.4167 18.3333 10.4167C18.3333 10.4167 15.8333 15 10 15C4.16667 15 1.66667 10.4167 1.66667 10.4167Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              Remember me
            </label>
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button
            type="submit"
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="spinner" width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite"/>
                  </circle>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <a href="#" className="signup-link">Sign up</a></p>
        </div>
      </div>
    </div>
  )
}

export default Login

