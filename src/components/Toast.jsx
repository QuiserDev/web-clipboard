import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 2000, onClose }) => {
  const [phase, setPhase] = useState('enter')

  useEffect(() => {
    // 进入动画后，duration 毫秒后开始退出
    const exitTimer = setTimeout(() => {
      setPhase('exit')
    }, duration)

    return () => clearTimeout(exitTimer)
  }, [duration])

  useEffect(() => {
    if (phase === 'exit') {
      // 等退出动画播完再卸载
      const unmountTimer = setTimeout(() => {
        if (onClose) onClose()
      }, 300)
      return () => clearTimeout(unmountTimer)
    }
  }, [phase, onClose])

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb'
        }
      case 'error':
        return {
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb'
        }
      default:
        return {
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          border: '1px solid #bee5eb'
        }
    }
  }

  const toastStyles = {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: phase === 'exit' ? 'translate(-50%, 100%)' : 'translateX(-50%)',
    padding: '12px 20px',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 10000,
    fontSize: '14px',
    fontWeight: '500',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    opacity: phase === 'exit' ? 0 : 1,
    ...getTypeStyles()
  }

  return (
    <div style={toastStyles}>
      {message}
    </div>
  )
}

export default Toast
