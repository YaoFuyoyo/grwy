const jwt = require('jsonwebtoken')
const { getCollection } = require('./db')

function verifyToken(req, res) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  
  if (!token) {
    return { ok: false, error: 'UNAUTHORIZED', message: '请先登录' }
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'zzyy99.cn',
      audience: 'zzyy99.cn'
    })
    return { ok: true, userId: decoded.userId, user: decoded }
  } catch (err) {
    return { ok: false, error: 'INVALID_TOKEN', message: '登录已过期，请重新登录' }
  }
}

async function getUserById(userId) {
  const collection = await getCollection('zzyy_auth', 'accounts')
  const user = await collection.findOne({ userId })
  if (user) {
    delete user.passwordHash
    delete user._id
  }
  return user
}

function generateToken(userId, phone, name) {
  return jwt.sign(
    { userId, phone, name },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
      issuer: 'zzyy99.cn',
      audience: 'zzyy99.cn'
    }
  )
}

module.exports = { verifyToken, getUserById, generateToken }
