// Token 校验接口

const jwt = require('jsonwebtoken')
const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI

let client = null
let db = null

async function getAuthDb() {
  if (db) return db
  client = new MongoClient(uri)
  await client.connect()
  db = client.db('zzyy_auth')
  return db
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    // 从请求头获取 Token
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ ok: false, error: '未提供 Token' })
    }

    // 校验 JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'zzyy99.cn',
      audience: 'zzyy99.cn'
    })

    // 查询用户信息
    const db = await getAuthDb()
    const user = await db.collection('accounts').findOne(
      { userId: decoded.userId },
      { projection: { passwordHash: 0 } } // 不返回密码
    )

    if (!user) {
      return res.status(404).json({ ok: false, error: '用户不存在' })
    }

    if (user.status !== 'active') {
      return res.status(403).json({ ok: false, error: '账号已被禁用' })
    }

    return res.status(200).json({
      ok: true,
      user: {
        userId: user.userId,
        phone: user.phone,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    })

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, error: 'Token 无效或已过期' })
    }
    console.log('verify 错误:', error.message)
    return res.status(500).json({ ok: false, error: error.message })
  }
}