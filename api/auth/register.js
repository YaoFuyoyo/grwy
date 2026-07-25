const bcrypt = require('bcryptjs')
const { applyCors } = require('../_util/cors')
const { getCollection, generateUserId } = require('../_util/db')
const { generateToken } = require('../_util/auth')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持POST方法' })
  }
  
  try {
    const body = JSON.parse(req.body)
    const { phone, password, name } = body
    
    if (!phone || !password || !name) {
      return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请填写完整信息' })
    }
    
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ ok: false, error: 'INVALID_PHONE', message: '请输入正确的手机号' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'INVALID_PASSWORD', message: '密码至少6位' })
    }
    
    const collection = await getCollection('zzyy_auth', 'accounts')
    const existing = await collection.findOne({ phone })
    
    if (existing) {
      return res.status(409).json({ ok: false, error: 'USER_EXISTS', message: '该手机号已注册' })
    }
    
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)
    const userId = await generateUserId()
    
    const newUser = {
      userId,
      phone,
      passwordHash,
      name,
      avatar: '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await collection.insertOne(newUser)
    
    const userResponse = { ...newUser }
    delete userResponse.passwordHash
    delete userResponse._id
    
    const token = generateToken(userId, phone, name)
    
    return res.status(200).json({
      ok: true,
      token,
      user: userResponse,
      message: '注册成功'
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
