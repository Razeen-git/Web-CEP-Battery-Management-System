import { useState, useEffect } from 'react'
import AppHeader from './AppHeader'
import './Wallet.css'

// Sample payment history data
const generatePaymentHistory = () => {
  const transactions = [
    { id: 1, type: 'credit', amount: 5000, description: 'Bank Transfer', date: '2024-01-15', status: 'completed', category: 'Deposit' },
    { id: 2, type: 'debit', amount: 1200, description: 'Online Purchase', date: '2024-01-14', status: 'completed', category: 'Shopping' },
    { id: 3, type: 'credit', amount: 2500, description: 'Salary Payment', date: '2024-01-10', status: 'completed', category: 'Income' },
    { id: 4, type: 'debit', amount: 800, description: 'Restaurant Payment', date: '2024-01-08', status: 'completed', category: 'Food' },
    { id: 5, type: 'debit', amount: 1500, description: 'Utility Bill', date: '2024-01-05', status: 'completed', category: 'Bills' },
    { id: 6, type: 'credit', amount: 3000, description: 'Refund', date: '2024-01-03', status: 'completed', category: 'Refund' },
    { id: 7, type: 'debit', amount: 2000, description: 'Shopping Mall', date: '2024-01-01', status: 'pending', category: 'Shopping' },
  ]
  return transactions
}

function Wallet() {
  const [walletBalance, setWalletBalance] = useState(12350.75)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0
  })

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const history = generatePaymentHistory()
      setPaymentHistory(history)
      
      // Calculate stats
      const income = history
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expenses = history
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0)
      
      // Monthly calculations (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const monthlyIncome = history
        .filter(t => t.type === 'credit' && new Date(t.date) >= thirtyDaysAgo)
        .reduce((sum, t) => sum + t.amount, 0)
      
      const monthlyExpenses = history
        .filter(t => t.type === 'debit' && new Date(t.date) >= thirtyDaysAgo)
        .reduce((sum, t) => sum + t.amount, 0)
      
      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        monthlyIncome,
        monthlyExpenses
      })
      
      setLoading(false)
    }, 800)
  }, [])

  const filteredHistory = selectedFilter === 'all' 
    ? paymentHistory 
    : paymentHistory.filter(t => 
        selectedFilter === 'income' ? t.type === 'credit' :
        selectedFilter === 'expenses' ? t.type === 'debit' :
        t.status === selectedFilter
      )

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Deposit': '💰',
      'Shopping': '🛍️',
      'Income': '💵',
      'Food': '🍔',
      'Bills': '📄',
      'Refund': '↩️',
      'Transfer': '💸'
    }
    return icons[category] || '💳'
  }

  if (loading) {
    return (
      <div className="wallet-page">
        <div className="wallet-loading">
          <div className="wallet-loader"></div>
          <p>Loading wallet information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-page app-shell">
      <AppHeader title="Digital" titleAccent="Wallet" />

      <main className="app-main wallet-content">
        {/* Wallet Balance Card */}
        <div className="wallet-balance-card">
          <div className="balance-header">
            <span className="balance-label">Total Balance</span>
            <button className="eye-btn" onClick={() => {}}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M1.66667 10C1.66667 10 4.16667 5.83333 10 5.83333C15.8333 5.83333 18.3333 10 18.3333 10C18.3333 10 15.8333 14.1667 10 14.1667C4.16667 14.1667 1.66667 10 1.66667 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="balance-amount">
            ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="balance-actions">
            <button className="action-btn-primary">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3.33333V16.6667M3.33333 10H16.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add Money
            </button>
            <button className="action-btn-secondary">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M13.3333 6.66667L16.6667 10L13.3333 13.3333M3.33333 10H16.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Send
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="wallet-stats-grid">
          <div className="stat-card income">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Income</span>
              <span className="stat-value">${stats.totalIncome.toLocaleString()}</span>
            </div>
          </div>

          <div className="stat-card expenses">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2V22M6 5H13.5C14.4283 5 15.3185 5.36875 15.9749 6.02513C16.6313 6.6815 17 7.57174 17 8.5C17 9.42826 16.6313 10.3185 15.9749 10.9749C15.3185 11.6313 14.4283 12 13.5 12H8.5C7.57174 12 6.6815 12.3687 6.02513 13.0251C5.36875 13.6815 5 14.5717 5 15.5C5 16.4283 5.36875 17.3185 6.02513 17.9749C6.6815 18.6313 7.57174 19 8.5 19H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Expenses</span>
              <span className="stat-value">${stats.totalExpenses.toLocaleString()}</span>
            </div>
          </div>

          <div className="stat-card monthly-income">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 3V21H21M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Monthly Income</span>
              <span className="stat-value">${stats.monthlyIncome.toLocaleString()}</span>
            </div>
          </div>

          <div className="stat-card monthly-expenses">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 3V21H21M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 12 12)"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Monthly Expenses</span>
              <span className="stat-value">${stats.monthlyExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="payment-history-section">
          <div className="section-header">
            <h2 className="section-title">Payment History</h2>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${selectedFilter === 'income' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('income')}
              >
                Income
              </button>
              <button 
                className={`filter-btn ${selectedFilter === 'expenses' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('expenses')}
              >
                Expenses
              </button>
              <button 
                className={`filter-btn ${selectedFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('pending')}
              >
                Pending
              </button>
            </div>
          </div>

          <div className="transactions-list">
            {filteredHistory.map((transaction, index) => (
              <div 
                key={transaction.id} 
                className="transaction-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="transaction-icon">
                  <span className="category-emoji">{getCategoryIcon(transaction.category)}</span>
                </div>
                <div className="transaction-details">
                  <div className="transaction-main">
                    <span className="transaction-description">{transaction.description}</span>
                    <span className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="transaction-meta">
                    <span className="transaction-date">{formatDate(transaction.date)}</span>
                    <span className={`transaction-status ${transaction.status}`}>
                      {transaction.status}
                    </span>
                    <span className="transaction-category">{transaction.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Wallet



