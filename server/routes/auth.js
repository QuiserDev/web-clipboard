import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDB } from '../database/db.js'
import { authenticateToken, getJwtSecret } from '../middleware/auth.js'

const router = express.Router()

// 邮箱格式验证
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// 注册
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ message: '请填写所有字段' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: '邮箱格式不正确' })
  }

  if (name.length > 50) {
    return res.status(400).json({ message: '姓名不能超过50个字符' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '密码长度至少6位' })
  }

  const db = getDB()

  // 检查邮箱是否已存在
  const existingUser = await new Promise((resolve, reject) => {
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })

  if (existingUser) {
    return res.status(400).json({ message: '邮箱已被注册' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name],
        function(err) {
          if (err) reject(err)
          else resolve(this.lastID)
        }
      )
    })

    const token = jwt.sign(
      { id: result, email, name },
      getJwtSecret(),
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: result,
        email,
        name
      }
    })
  } catch (error) {
    console.error('注册失败:', error.message)
    res.status(500).json({ message: '注册失败' })
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

    try {
      const validPassword = await bcrypt.compare(password, user.password)
      if (!validPassword) {
        return res.status(400).json({ message: '邮箱或密码错误' })
      }

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
    } catch (error) {
      console.error('登录失败:', error.message)
      res.status(500).json({ message: '服务器错误' })
    }
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

  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    try {
      const validPassword = await bcrypt.compare(currentPassword, user.password)
      if (!validPassword) {
        return res.status(400).json({ message: '当前密码错误' })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)

      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id], (err) => {
        if (err) {
          return res.status(500).json({ message: '修改密码失败' })
        }

        res.json({ message: '密码修改成功' })
      })
    } catch (error) {
      console.error('修改密码失败:', error.message)
      res.status(500).json({ message: '服务器错误' })
    }
  })
})

export default router
