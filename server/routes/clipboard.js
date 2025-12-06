import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { getDB } from '../database/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// 上传目录路径
const uploadsDir = path.join(__dirname, '../uploads')

import jwt from 'jsonwebtoken'

// 中间件：验证JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: '访问令牌缺失' })
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '令牌无效' })
    }
    req.user = user
    next()
  })
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage
})

// 文字剪贴板路由
router.route('/text/:id?')
  .delete(authenticateToken, (req, res) => {
    const id = req.params.id || req.body.id
    
    if (!id) {
      return res.status(400).json({ message: '项目ID不能为空' })
    }

    const db = getDB()

    db.run(
      'DELETE FROM text_items WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '删除文字失败' })
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '项目不存在或无权删除' })
        }

        res.json({ success: true })
      }
    )
  })
  .get(authenticateToken, (req, res) => {
    const limit = parseInt(req.query.limit)
    const db = getDB()
    
    let query = 'SELECT * FROM text_items WHERE user_id = ? ORDER BY created_at DESC'
    let params = [req.user.id]
    
    if (limit) {
      query += ' LIMIT ?'
      params.push(limit)
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ message: '获取文字失败' })
      }

      const items = rows.map(row => ({
        id: row.id,
        content: row.content,
        createdAt: row.created_at
      }))

      res.json({ items })
    })
  })
  .post(authenticateToken, (req, res) => {
    const { content } = req.body

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '文字内容不能为空' })
    }

    const db = getDB()

    db.run(
      'INSERT INTO text_items (user_id, content) VALUES (?, ?)',
      [req.user.id, content.trim()],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '保存文字失败' })
        }

        res.json({
          item: {
            id: this.lastID,
            content: content.trim(),
            createdAt: new Date().toISOString()
          }
        })
      }
    )
  })

// 图片剪贴板路由
router.route('/image/:id?')
  .delete(authenticateToken, (req, res) => {
    const id = req.params.id || req.body.id
    const filename = req.body.filename
    
    if (!id) {
      return res.status(400).json({ message: '项目ID不能为空' })
    }

    const db = getDB()

    db.run(
      'DELETE FROM image_items WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '删除图片失败' })
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '项目不存在或无权删除' })
        }

        // 删除物理文件
        if (filename) {
          const filePath = path.join(uploadsDir, filename)
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
          } catch (fileErr) {
            console.error('删除文件失败:', fileErr)
          }
        }

        res.json({ success: true })
      }
    )
  })
  .get(authenticateToken, (req, res) => {
    const limit = parseInt(req.query.limit)
    const db = getDB()
    
    let query = 'SELECT * FROM image_items WHERE user_id = ? ORDER BY created_at DESC'
    let params = [req.user.id]
    
    if (limit) {
      query += ' LIMIT ?'
      params.push(limit)
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ message: '获取图片失败' })
      }

      const items = rows.map(row => ({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        size: row.size,
        mimeType: row.mime_type,
        url: `/uploads/${row.filename}`,
        createdAt: row.created_at
      }))

      res.json({ items })
    })
  })
  .post(authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: '请选择图片文件' })
    }

    if (!req.file.mimetype.startsWith('image/')) {
      fs.unlinkSync(req.file.path) // 删除无效文件
      return res.status(400).json({ message: '请上传有效的图片文件' })
    }

    const db = getDB()

    db.run(
      'INSERT INTO image_items (user_id, filename, original_name, size, mime_type) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, req.file.filename, req.file.originalname, req.file.size, req.file.mimetype],
      function(err) {
        if (err) {
          fs.unlinkSync(req.file.path) // 删除文件
          return res.status(500).json({ message: '上传图片失败' })
        }

        res.json({
          item: {
            id: this.lastID,
            filename: req.file.filename,
            originalName: req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            size: req.file.size,
            createdAt: new Date().toISOString()
          }
        })
      }
    )
  })

// 文件剪贴板路由
router.route('/file/:id?')
  .delete(authenticateToken, (req, res) => {
    const id = req.params.id || req.body.id
    const filename = req.body.filename
    
    if (!id) {
      return res.status(400).json({ message: '项目ID不能为空' })
    }

    const db = getDB()

    db.run(
      'DELETE FROM file_items WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '删除文件失败' })
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '项目不存在或无权删除' })
        }

        // 删除物理文件
        if (filename) {
          const filePath = path.join(uploadsDir, filename)
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
          } catch (fileErr) {
            console.error('删除文件失败:', fileErr)
          }
        }

        res.json({ success: true })
      }
    )
  })
  .get(authenticateToken, (req, res) => {
    const limit = parseInt(req.query.limit)
    const db = getDB()
    
    let query = 'SELECT * FROM file_items WHERE user_id = ? ORDER BY created_at DESC'
    let params = [req.user.id]
    
    if (limit) {
      query += ' LIMIT ?'
      params.push(limit)
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ message: '获取文件失败' })
      }

      const items = rows.map(row => ({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        size: row.size,
        mimeType: row.mime_type,
        url: `/uploads/${row.filename}`,
        createdAt: row.created_at
      }))

      res.json({ items })
    })
  })
  .post(authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: '请选择文件' })
    }

    const db = getDB()

    db.run(
      'INSERT INTO file_items (user_id, filename, original_name, size, mime_type) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, req.file.filename, req.file.originalname, req.file.size, req.file.mimetype],
      function(err) {
        if (err) {
          fs.unlinkSync(req.file.path) // 删除文件
          return res.status(500).json({ message: '上传文件失败' })
        }

        res.json({
          item: {
            id: this.lastID,
            filename: req.file.filename,
            originalName: req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            size: req.file.size,
            createdAt: new Date().toISOString()
          }
        })
      }
    )
  })

export default router