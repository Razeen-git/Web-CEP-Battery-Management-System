import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Battery from './components/Battery'
import Wallet from './components/Wallet'
import BmsClassifier from './components/BmsClassifier'
import './App.css'

function AppContent() {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated')
      setIsAuthenticated(authStatus === 'true')
      setIsLoading(false)
    }
    
    checkAuth()
    
    // Listen for custom auth state change event
    const handleAuthChange = () => {
      checkAuth()
    }
    
    // Listen for storage events (when localStorage changes in other tabs/windows)
    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated') {
        checkAuth()
      }
    }
    
    window.addEventListener('authStateChanged', handleAuthChange)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Re-check auth whenever location changes
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated')
    setIsAuthenticated(authStatus === 'true')
  }, [location])

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="route-container">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/battery" 
          element={
            isAuthenticated ? <Battery /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/wallet" 
          element={
            isAuthenticated ? <Wallet /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/battery-ai" 
          element={
            isAuthenticated ? <BmsClassifier /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
