import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Toast from '../Toast'

function TextClipboard({ items, onItemAdd, onItemDelete }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(false)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!text.trim()) {
      alert('请输入文字内容')
      return
    }

    setLoading(true)
    
    try {
      const response = await axios.post('/api/clipboard/text', { content: text })
      onItemAdd(response.data.item)
      setText('')
    } catch (error) {
      console.error('保存文字失败:', error)
      alert('保存失败，请重试')
    }
    
    setLoading(false)
  }

  const copyToClipboard = async (content, event) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content)
        setToast({
          message: '✓ 已复制到剪贴板',
          type: 'success'
        })
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = content
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (successful) {
          setToast({
            message: '✓ 已复制到剪贴板',
            type: 'success'
          })
        } else {
          throw new Error('复制命令失败')
        }
      }
    } catch (error) {
      console.error('复制失败:', error)
      setToast({
        message: '✗ 复制失败，请重试',
        type: 'error'
      })
    }
  }

  const viewAll = () => {
    navigate('/view-all/text')
  }

  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
    setDeleteError(false)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    setDeletingId(itemToDelete.id)
    setDeleteError(false)
    
    try {
      await axios.delete('/api/clipboard/text', {
        data: { id: itemToDelete.id }
      })
      
      if (onItemDelete) {
        onItemDelete(itemToDelete.id)
      }
      
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('删除失败:', error)
      setDeleteError(true)
      setTimeout(() => setDeleteError(false), 2000)
    }
    
    setDeletingId(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
    setDeleteError(false)
  }

  return (
    <div className="clipboard-section">
      <h3>📝 文字剪贴板</h3>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴或输入文字内容..."
          className="form-control"
        />
        
        <button 
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? '保存中...' : '保存文字'}
        </button>
      </form>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <div className="preview-area">
        <h4>最近保存的文字</h4>
        {items.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center' }}>暂无保存的文字</p>
        ) : (
          <>
            {items.map((item) => (
              <div 
                key={item.id} 
                className="preview-item"
                onClick={(e) => copyToClipboard(item.content, e)}
              >
                <div className="text-item" title={item.content}>
                  {item.content}
                </div>
                <div className="action-buttons">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(item.content, e);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    复制
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(item);
                    }}
                    className="btn btn-danger btn-sm"
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? '删除中...' : '删除'}
                  </button>
                </div>
              </div>
            ))}
            <button className="more-btn" onClick={viewAll}>
              查看更多 →
            </button>
          </>
        )}
      </div>

      {/* 删除确认模态框 */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0, color: '#dc3545' }}>⚠️ 确认删除</h3>
            <p>确定要删除这条文字吗？此操作不可撤销。</p>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end',
              marginTop: '1.5rem'
            }}>
              <button 
                onClick={handleDeleteCancel}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="btn btn-danger delete-confirm-btn"
                disabled={deletingId}
                style={deleteError ? { backgroundColor: '#dc3545' } : {}}
              >
                {deleteError ? '✗ 删除失败' : deletingId ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TextClipboard
