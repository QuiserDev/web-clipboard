import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { useClipboard } from '../../contexts/ClipboardContext'
import Toast from '../Toast'
import FileIcon from '../FileIcon'

function ViewAllItems() {
  const { type } = useParams()
  const navigate = useNavigate()
  const { notifyClipboardUpdate } = useClipboard()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchAllItems()
  }, [type])

  const fetchAllItems = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await axios.get(`/api/clipboard/${type}`)
      setItems(response.data.items || [])
    } catch (error) {
      console.error('获取项目失败:', error)
      setError('获取项目失败，请重试')
    }
    
    setLoading(false)
  }

  const copyToClipboard = async (content, event) => {
    try {
      await navigator.clipboard.writeText(content)
      // 使用Toast显示成功消息
      setToast({
        message: '✓ 已复制到剪贴板',
        type: 'success'
      })
    } catch (error) {
      console.error('复制失败:', error)
      // 使用Toast显示错误消息
      setToast({
        message: '✗ 复制失败，请重试',
        type: 'error'
      })
    }
  }

  const downloadFile = (fileUrl, filename) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = filename
    link.click()
  }

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop().toLowerCase()
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📽️',
      pptx: '📽️',
      zip: '📦',
      rar: '📦',
      txt: '📃',
      js: '⚙️',
      html: '🌐',
      css: '🎨',
      json: '📋'
    }
    return icons[ext] || '📎'
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    
    setDeletingId(itemToDelete.id)
    
    try {
      if (type === 'text') {
        // 文字类型使用URL参数
        await axios.delete(`/api/clipboard/${type}/${itemToDelete.id}`)
      } else {
        // 图片和文件类型需要传递filename信息
        await axios.delete(`/api/clipboard/${type}`, {
          data: {
            id: itemToDelete.id,
            filename: itemToDelete.filename
          }
        })
      }
      setItems(prev => prev.filter(item => item.id !== itemToDelete.id))
      setShowDeleteModal(false)
      setItemToDelete(null)
      
      // 通知Dashboard和其他组件剪贴板内容已更新
      notifyClipboardUpdate()
    } catch (error) {
      console.error('删除失败:', error)
      setError('删除失败，请重试')
    }
    
    setDeletingId(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
    setDeletingId(null)
  }

  const getTitle = () => {
    switch (type) {
      case 'text': return '所有文字项目'
      case 'image': return '所有图片项目'
      case 'file': return '所有文件项目'
      default: return '所有项目'
    }
  }

  const renderTextItem = (item) => (
    <div key={item.id} className="item-card">
      <div className="item-content">
        <div className="item-header">
          <span className="item-date">{formatDate(item.createdAt)}</span>
        </div>
        <div className="text-content">{item.content}</div>
      </div>
      <div className="item-actions">
        <div className="action-buttons">
          <button 
            onClick={(e) => copyToClipboard(item.content, e)}
            className="btn btn-primary btn-sm"
          >
            复制
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
    </div>
  )

  const renderImageItem = (item) => (
    <div key={item.id} className="item-card">
      <div className="item-content">
        <div className="item-header">
          <span className="item-filename">{item.originalName}</span>
          <span className="item-date">{formatDate(item.createdAt)}</span>
        </div>
        <div className="image-preview-container">
          <img src={item.url} alt={item.originalName} className="image-preview-large" />
        </div>
        <div className="item-info">
          <span>大小: {formatFileSize(item.size)}</span>
        </div>
      </div>
      <div className="item-actions">
        <div className="action-buttons">
          <button 
            onClick={() => downloadFile(item.url, item.originalName)}
            className="btn btn-primary btn-sm"
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
    </div>
  )

  const renderFileItem = (item) => (
    <div key={item.id} className="item-card">
      <div className="item-content">
        <div className="item-header">
          <span className="item-date">{formatDate(item.createdAt)}</span>
        </div>
        <div className="file-info">
          <FileIcon filename={item.originalName} />
          <div className="file-details">
            <div className="file-name" title={item.originalName}>{item.originalName}</div>
            <div className="file-size">大小: {formatFileSize(item.size)}</div>
          </div>
        </div>
      </div>
      <div className="item-actions">
        <div className="action-buttons">
          <button 
            onClick={() => downloadFile(item.url, item.originalName)}
            className="btn btn-primary btn-sm"
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
    </div>
  )

  const renderItems = () => {
    if (type === 'text') {
      return items.map(renderTextItem)
    } else if (type === 'image') {
      return items.map(renderImageItem)
    } else if (type === 'file') {
      return items.map(renderFileItem)
    }
    return null
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button onClick={fetchAllItems} className="btn btn-primary">
        重试
      </button>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="view-all-header">
        <button onClick={() => navigate('/')} className="btn btn-secondary">
        ← 返回仪表盘
      </button>
        <h1>{getTitle()}</h1>
        <span className="item-count">共 {items.length} 个项目</span>
      </div>
      
      <div className="items-grid">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>暂无项目</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
            返回仪表盘添加项目
          </button>
          </div>
        ) : (
          renderItems()
        )}
      </div>
      
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ 确认删除</h3>
            <p>确定要删除这个{type === 'text' ? '文字' : type === 'image' ? '图片' : '文件'}吗？此操作不可撤销。</p>
            <div className="modal-actions">
              <button 
                  onClick={handleDeleteCancel}
                  className="btn btn-secondary"
                  disabled={deletingId !== null}
                >
                  取消
                </button>
              <button 
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
                disabled={deletingId !== null}
              >
                {deletingId !== null ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  )
}

export default ViewAllItems