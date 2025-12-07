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
const envPath = path.join(__dirname, '../.env.production');
console.log('Loading env file from:', envPath);
dotenv.config({ path: envPath })

// 调试信息
console.log('Environment variables loading:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT from env:', process.env.PORT);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

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

// 初始化数据库并启动服务器
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`)
  })
}).catch(error => {
  console.error('数据库初始化失败:', error)
  process.exit(1)
})