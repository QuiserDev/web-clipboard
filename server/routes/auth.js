import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDB } from '../database/db.js'

const router = express.Router()

// 获取JWT_SECRET的函数，确保总是获取最新的环境变量值
function getJwtSecret() {
  return process.env.JWT_SECRET || 'your-secret-key-change-in-production'
}

// 中间件：验证JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: '访问令牌缺失' })
  }

  jwt.verify(token, getJwtSecret(), (err, user) => {
    if (err) {
      return res.status(403).json({ message: '令牌无效' })
    }
    req.user = user
    next()
  })
}

// 注册
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ message: '请填写所有字段' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '密码长度至少6位' })
  }

  const db = getDB()

  try {
    // 检查邮箱是否已存在
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' })
      }

      if (row) {
        return res.status(400).json({ message: '邮箱已被注册' })
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10)

      // 插入新用户
      db.run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name],
        function(err) {
          if (err) {
            return res.status(500).json({ message: '注册失败' })
          }

          // 生成JWT token
          const token = jwt.sign(
            { id: this.lastID, email, name },
            getJwtSecret(),
            { expiresIn: '24h' }
          )

          res.json({
            token,
            user: {
              id: this.lastID,
              email,
              name
            }
          })
        }
      )
    })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
})

// 登录
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: '请填写所有字段' })
  }

  const db = getDB()

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' })
    }

    if (!user) {
      return res.status(400).json({ message: '邮箱或密码错误' })
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ message: '邮箱或密码错误' })
    }

    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      getJwtSecret(),
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  })
})

// 获取当前用户信息
router.get('/me', authenticateToken, (req, res) => {
  const db = getDB()

  db.get('SELECT id, email, name FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    res.json({ user })
  })
})

// 修改密码
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: '请填写所有字段' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: '新密码长度至少6位' })
  }

  const db = getDB()

  // 获取当前用户信息
  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    // 验证当前密码
    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) {
      return res.status(400).json({ message: '当前密码错误' })
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 更新密码
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id], (err) => {
      if (err) {
        return res.status(500).json({ message: '修改密码失败' })
      }

      res.json({ message: '密码修改成功' })
    })
  })
})

export default router