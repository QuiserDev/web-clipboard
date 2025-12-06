import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { changePassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少6位')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    
    const result = await changePassword(currentPassword, newPassword)
    
    if (result.success) {
      setSuccess('密码修改成功！请重新登录')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // 延迟2秒后清除登录态并跳转到登录界面
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 2000)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div className="card">
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>修改密码</h2>
          
          {error && (
            <div style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: '0.75rem', 
              borderRadius: '5px', 
              marginBottom: '1rem' 
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ 
              background: '#e8f5e8', 
              color: '#2e7d32', 
              padding: '0.75rem', 
              borderRadius: '5px', 
              marginBottom: '1rem' 
            }}>
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">当前密码</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">新密码</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">确认新密码</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? '修改中...' : '修改密码'}
              </button>
              
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => navigate('/dashboard')}
              >
                返回
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword