import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import ChangePassword from './components/ChangePassword'
import ViewAllItems from './components/clipboards/ViewAllItems'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ClipboardProvider } from './contexts/ClipboardContext'

function App() {
  return (
    <AuthProvider>
      <ClipboardProvider>
        <Router>
          <div className="App">
            <AppContent />
          </div>
        </Router>
      </ClipboardProvider>
    </AuthProvider>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>加载中...</div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/change-password" 
          element={user ? <ChangePassword /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/view-all/:type" 
          element={user ? <ViewAllItems /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  )
}

export default App