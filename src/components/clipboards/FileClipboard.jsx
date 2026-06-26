import React, { useState, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import FileIcon from '../FileIcon'

function FileClipboard({ items, onItemAdd, onItemDelete }) {
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [visibleButtons, setVisibleButtons] = useState({})
  const [uploadMessage, setUploadMessage] = useState(null) // React 状态替代 DOM 操作
  const [deleteError, setDeleteError] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleFileSelect = async (event) => {
    const files = event.target.files
    if (files.length > 0) {
      await uploadFiles(files)
    }
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    event.currentTarget.classList.remove('dragover')
    
    const files = event.dataTransfer.files
    if (files.length > 0) {
      await uploadFiles(files)
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

  // 显示上传区域的临时消息
  const showUploadMessage = (message) => {
    setUploadMessage(message)
    setTimeout(() => setUploadMessage(null), 2000)
  }

  const uploadFiles = async (files) => {
    const fileArray = Array.from(files)
    
    setLoading(true)

    try {
      for (const file of fileArray) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post('/api/clipboard/file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        onItemAdd(response.data.item)
      }
    } catch (error) {
      console.error('上传文件失败:', error)
      showUploadMessage('✗ 上传失败，请重试')
    }
    
    setLoading(false)
    
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadFile = (fileUrl, filename) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = filename
    link.click()
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const viewAll = () => {
    navigate('/view-all/file')
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
      await axios.delete('/api/clipboard/file', {
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
      <h3>📁 文件剪贴板</h3>
      
      <div 
        className="upload-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        tabIndex="0"
        style={{ outline: 'none', cursor: 'pointer' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {uploadMessage ? (
          <p style={{ color: '#dc3545' }}>{uploadMessage}</p>
        ) : (
          <div>
            <p>📎 点击选择文件 或 拖拽文件到这里</p>
          </div>
        )}
      </div>
      
      <button 
        className="btn btn-primary btn-block"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? '上传中...' : '选择文件'}
      </button>
      
      <div className="preview-area">
        <h4>最近上传的文件</h4>
        {items.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center' }}>暂无上传的文件</p>
        ) : (
          <>
            {items.map((item) => (
              <div 
                key={item.id} 
                className={`preview-item ${visibleButtons[item.id] ? 'buttons-visible' : ''}`}
                onMouseEnter={() => setVisibleButtons(prev => ({ ...prev, [item.id]: true }))}
                onMouseLeave={() => setVisibleButtons(prev => ({ ...prev, [item.id]: false }))}
              >
                <div className="file-info" onClick={() => downloadFile(item.url, item.filename)}>
                  <FileIcon filename={item.originalName || item.filename} />
                  <div className="file-details">
                    <div className="file-name" title={item.originalName || item.filename}>
                      {item.originalName || item.filename}
                    </div>
                    <div className="file-size">
                      {formatFileSize(item.size)}
                    </div>
                  </div>
                </div>
                <div className={`action-buttons ${visibleButtons[item.id] ? 'visible' : ''}`}>
                  <button 
                    onClick={() => downloadFile(item.url, item.filename)}
                    className="btn btn-secondary btn-sm"
                  >
                    下载
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(item)}
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
            <p>确定要删除这个文件吗？此操作不可撤销。</p>
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

export default FileClipboard
