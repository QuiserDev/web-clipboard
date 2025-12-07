import React, { useState, useEffect } from 'react'
import TextClipboard from './clipboards/TextClipboard'
import ImageClipboard from './clipboards/ImageClipboard'
import FileClipboard from './clipboards/FileClipboard'
import axios from 'axios'
import { useClipboard } from '../contexts/ClipboardContext'
import { useAuth } from '../contexts/AuthContext'

function Dashboard() {
  const [textItems, setTextItems] = useState([])
  const [imageItems, setImageItems] = useState([])
  const [fileItems, setFileItems] = useState([])
  const { clipboardUpdate } = useClipboard()
  const { user } = useAuth()

  useEffect(() => {
    fetchRecentItems()
  }, [clipboardUpdate, user])

  const fetchRecentItems = async () => {
    // 确保用户已认证
    if (!user) return;
    
    // 确保axios有正确的认证头部
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    try {
      const [textRes, imageRes, fileRes] = await Promise.all([
        axios.get('/api/clipboard/text?limit=5'),
        axios.get('/api/clipboard/image?limit=5'),
        axios.get('/api/clipboard/file?limit=5')
      ])
      
      setTextItems(textRes.data.items || [])
      setImageItems(imageRes.data.items || [])
      setFileItems(fileRes.data.items || [])
    } catch (error) {
      console.error('获取剪贴板内容失败:', error)
    }
  }

  const handleTextAdd = (newItem) => {
    setTextItems(prev => [newItem, ...prev].slice(0, 5))
  }

  const handleImageAdd = (newItem) => {
    setImageItems(prev => [newItem, ...prev].slice(0, 5))
  }

  const handleFileAdd = (newItem) => {
    setFileItems(prev => [newItem, ...prev].slice(0, 5))
  }

  const handleTextDelete = async (itemId) => {
    setTextItems(prev => prev.filter(item => item.id !== itemId))
    // 删除后重新获取数据以保持显示最新的5个项目
    await fetchRecentItems()
  }

  const handleImageDelete = async (itemId) => {
    setImageItems(prev => prev.filter(item => item.id !== itemId))
    // 删除后重新获取数据以保持显示最新的5个项目
    await fetchRecentItems()
  }

  const handleFileDelete = async (itemId) => {
    setFileItems(prev => prev.filter(item => item.id !== itemId))
    // 删除后重新获取数据以保持显示最新的5个项目
    await fetchRecentItems()
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', margin: '2rem 0' }}>我的剪贴板</h1>
      
      <div className="clipboard-grid">
        <TextClipboard 
          items={textItems}
          onItemAdd={handleTextAdd}
          onItemDelete={handleTextDelete}
        />
        
        <ImageClipboard 
          items={imageItems}
          onItemAdd={handleImageAdd}
          onItemDelete={handleImageDelete}
        />
        
        <FileClipboard 
          items={fileItems}
          onItemAdd={handleFileAdd}
          onItemDelete={handleFileDelete}
        />
      </div>
    </div>
  )
}

export default Dashboard