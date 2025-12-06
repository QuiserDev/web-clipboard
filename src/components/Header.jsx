import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <div className="logo">
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
              在线剪贴板
            </Link>
          </div>
          
          <div className="nav-links">
            {user ? (
              <>
                <span>欢迎，{user.name}</span>
                <Link to="/change-password" className="btn btn-secondary">
                  修改密码
                </Link>
                <button onClick={logout} className="btn btn-secondary">
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">登录</Link>
                <Link to="/register" className="btn btn-primary">注册</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header