// 全局注册接口

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
    const { phone, password, name } = body

    // 参数校验
    if (!phone || !password || !name) {
      return res.status(400).json({ ok: false, error: '缺少必填参数' })
    }

    // 手机号格式校验（中国大陆手机号）
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ ok: false, error: '手机号格式不正确' })
    }

    // 密码长度校验
    if (password.length < 8) {
      return res.status(400).json({ ok: false, error: '密码至少8位' })
    }

    const db = await getAuthDb()
    const accounts = db.collection('accounts')
    const counters = db.collection('counters')

    // 检查手机号是否已注册
    const existUser = await accounts.findOne({ phone })
    if (existUser) {
      return res.status(409).json({ ok: false, error: '该手机号已注册' })
    }

    // 生成自增 userId
    const counter = await counters.findOneAndUpdate(
      { name: 'user_id' },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: 'after' }
    )
    const userIdNum = counter.value || 1
    const userId = 'U' + String(userIdNum).padStart(6, '0')

    // 密码加密
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // 创建用户
    const now = new Date()
    await accounts.insertOne({
      userId,
      phone,
      passwordHash,
      name,
      email: '',
      avatar: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    })

    // 生成 JWT Token
    const token = jwt.sign(
      { userId, phone, name },
      process.env.JWT_SECRET,
      { expiresIn: '7d', issuer: 'zzyy99.cn', audience: 'zzyy99.cn' }
    )

    // 写入 session
    await db.collection('sessions').insertOne({
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now
    })

    return res.status(200).json({
      ok: true,
      token,
      user: { userId, phone, name }
    })

  } catch (error) {
    console.log('register 错误:', error.message)
    return res.status(500).json({ ok: false, error: error.message })
  }
}