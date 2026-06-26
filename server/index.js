import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import clipboardRoutes from './routes/clipboard.js'
import { initDatabase } from './database/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 使用绝对路径加载环境变量
const envPath = path.join(__dirname, '../.env.production')
dotenv.config({ path: envPath })

const app = express()
const PORT = process.env.PORT || 5000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../dist')))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/clipboard', clipboardRoutes)

// 静态文件服务（用于上传的文件）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 处理前端路由（SPA）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('未处理的服务器错误:', err.message)
  res.status(500).json({ message: '服务器内部错误' })
})

// 初始化数据库并启动服务器
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`)
  })
}).catch(error => {
  console.error('数据库初始化失败:', error)
  process.exit(1)
})
