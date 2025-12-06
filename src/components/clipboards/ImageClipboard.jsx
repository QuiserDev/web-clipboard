import React, { useState, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function ImageClipboard({ items, onItemAdd, onItemDelete }) {
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (file) {
      await uploadImage(file)
    }
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    event.currentTarget.classList.remove('dragover')
    
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const imageFile = Array.from(files).find(file => file.type.startsWith('image/'))
      if (imageFile) {
        await uploadImage(imageFile)
      } else {
        alert('请选择图片文件')
      }
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.currentTarget.classList.add('dragover')
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    event.currentTarget.classList.remove('dragover')
  }

  const handlePaste = async (event) => {
    const items = event.clipboardData?.items
    if (items) {
      for (let item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            await uploadImage(file)
            break
          }
        }
      }
    }
  }

  const uploadImage = async (file) => {
    if (!file.type.startsWith('image/')) {
      // 使用更美观的提示方式
      const uploadArea = document.querySelector('.upload-area')
      const originalHTML = uploadArea.innerHTML
      uploadArea.innerHTML = '<p style="color: #dc3545;">✗ 请选择图片文件</p>'
      
      setTimeout(() => {
        uploadArea.innerHTML = originalHTML
      }, 2000)
      return
    }

    setLoading(true)
    
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await axios.post('/api/clipboard/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      onItemAdd(response.data.item)
    } catch (error) {
      console.error('上传图片失败:', error)
      // 使用更美观的错误提示
      const uploadArea = document.querySelector('.upload-area')
      const originalHTML = uploadArea.innerHTML
      uploadArea.innerHTML = '<p style="color: #dc3545;">✗ 上传失败，请重试</p>'
      
      setTimeout(() => {
        uploadArea.innerHTML = originalHTML
      }, 2000)
    }
    
    setLoading(false)
  }

  const downloadImage = (imageUrl, filename) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.click()
  }

  const viewAll = () => {
    navigate('/view-all/image')
  }

  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    setDeletingId(itemToDelete.id)
    
    try {
      await axios.delete('/api/clipboard/image', {
        data: { 
          id: itemToDelete.id,
          filename: itemToDelete.filename 
        }
      })
      
      if (onItemDelete) {
        onItemDelete(itemToDelete.id)
      }
      
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('删除失败:', error)
      // 使用更美观的错误提示
      const deleteButton = document.querySelector('.delete-confirm-btn')
      if (deleteButton) {
        const originalText = deleteButton.textContent
        deleteButton.textContent = '✗ 删除失败'
        deleteButton.style.backgroundColor = '#dc3545'
        
        setTimeout(() => {
          deleteButton.textContent = originalText
          deleteButton.style.backgroundColor = ''
        }, 2000)
      }
    }
    
    setDeletingId(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  return (
    <div className="clipboard-section">
      <h3>🖼️ 图片剪贴板</h3>
      
      <div 
        className="upload-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        onClick={() => fileInputRef.current?.click()}
        tabIndex="0"
        style={{ outline: 'none' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <div>
          <p>📎 点击选择图片 或 拖拽图片到这里</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
            支持右键粘贴图片
          </p>
        </div>
      </div>
      
      <button 
        className="btn btn-primary btn-block"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? '上传中...' : '确认上传'}
      </button>
      
      <div className="preview-area">
        <h4>最近上传的图片</h4>
        {items.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center' }}>暂无上传的图片</p>
        ) : (
          <>
            {items.map((item) => (
              <div 
                key={item.id} 
                className="preview-item"
                onClick={() => downloadImage(item.url, item.filename)}
              >
                <div className="file-info">
                  <img 
                    src={item.url} 
                    alt="预览" 
                    className="image-preview"
                  />
                  <div className="file-details">
                    <div className="file-name" title={item.originalName || item.filename}>
                      {item.originalName || item.filename}
                    </div>
                  </div>
                </div>
                <div className="action-buttons">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(item.url, item.filename);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    下载
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
            <p>确定要删除这张图片吗？此操作不可撤销。</p>
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
              >
                {deletingId ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageClipboard