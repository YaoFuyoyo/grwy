// 全局登录接口

const bcrypt = require('bcryptjs')
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    const body = req.body || {}
    const { phone, password } = body

    // 参数校验
    if (!phone || !password) {
      return res.status(400).json({ ok: false, error: '缺少手机号或密码' })
    }

    const db = await getAuthDb()
    const accounts = db.collection('accounts')

    // 查询用户
    const user = await accounts.findOne({ phone })
    if (!user) {
      return res.status(404).json({ ok: false, error: '手机号未注册' })
    }

    // 校验密码
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(400).json({ ok: false, error: '密码错误' })
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({ ok: false, error: '账号已被禁用' })
    }

    // 生成 JWT Token
    const token = jwt.sign(
      { userId: user.userId, phone: user.phone, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d', issuer: 'zzyy99.cn', audience: 'zzyy99.cn' }
    )

    // 写入 session
    await db.collection('sessions').insertOne({
      token,
      userId: user.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    })

    return res.status(200).json({
      ok: true,
      token,
      user: {
        userId: user.userId,
        phone: user.phone,
        name: user.name
      }
    })

  } catch (error) {
    console.log('login 错误:', error.message)
    return res.status(500).json({ ok: false, error: error.message })
  }
}