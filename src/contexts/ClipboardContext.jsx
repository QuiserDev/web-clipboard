import React, { createContext, useContext, useState } from 'react'

const ClipboardContext = createContext()

export function useClipboard() {
  return useContext(ClipboardContext)
}

export function ClipboardProvider({ children }) {
  const [clipboardUpdate, setClipboardUpdate] = useState(0)

  // 通知所有组件剪贴板内容已更新
  const notifyClipboardUpdate = () => {
    setClipboardUpdate(prev => prev + 1)
  }

  const value = {
    clipboardUpdate,
    notifyClipboardUpdate
  }

  return (
    <ClipboardContext.Provider value={value}>
      {children}
    </ClipboardContext.Provider>
  )
}