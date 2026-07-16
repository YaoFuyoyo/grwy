// 全局退出登录接口

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

    // 校验 Token 是否有效（可选，也可以直接删除）
    try {
      jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'zzyy99.cn',
        audience: 'zzyy99.cn'
      })
    } catch (e) {
      // Token 已过期或无效，仍然继续删除
    }

    // 从数据库删除 session
    const db = await getAuthDb()
    await db.collection('sessions').deleteOne({ token })

    return res.status(200).json({
      ok: true,
      message: '登出成功'
    })

  } catch (error) {
    console.log('logout 错误:', error.message)
    return res.status(500).json({ ok: false, error: error.message })
  }
}