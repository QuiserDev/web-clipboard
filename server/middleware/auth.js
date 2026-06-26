import jwt from 'jsonwebtoken'

// 获取JWT_SECRET，确保总是获取最新的环境变量值
export function getJwtSecret() {
  return process.env.JWT_SECRET || 'your-secret-key-change-in-production'
}

// 中间件：验证JWT token
export function authenticateToken(req, res, next) {
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
