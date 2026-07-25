const bcrypt = require('bcryptjs')
const { applyCors } = require('./_util/cors')
const { getCollection, generateUserId } = require('./_util/db')
const { generateToken, verifyToken, getUserById } = require('./_util/auth')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  const action = req.query.action || ''
  
  try {
    if (action === 'login' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { phone, password } = body
      
      if (!phone || !password) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请填写手机号和密码' })
      }
      
      const collection = await getCollection('zzyy_auth', 'accounts')
      const user = await collection.findOne({ phone })
      
      if (!user) {
        return res.status(401).json({ ok: false, error: 'USER_NOT_FOUND', message: '用户不存在，请先注册' })
      }
      
      if (!user.passwordHash) {
        return res.status(401).json({ ok: false, error: 'INVALID_USER', message: '用户数据异常，请重新注册' })
      }
      
      if (user.status !== 'active') {
        return res.status(401).json({ ok: false, error: 'USER_DISABLED', message: '账号已禁用' })
      }
      
      const valid = await bcrypt.compare(password, user.passwordHash)
      
      if (!valid) {
        return res.status(401).json({ ok: false, error: 'INVALID_PASSWORD', message: '密码错误' })
      }
      
      const userResponse = { ...user }
      delete userResponse.passwordHash
      delete userResponse._id
      
      const token = generateToken(user.userId, user.phone, user.name)
      
      return res.status(200).json({
        ok: true,
        token,
        user: userResponse,
        message: '登录成功'
      })
    }
    
    if (action === 'register' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
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
    }
    
    if (action === 'logout' && req.method === 'POST') {
      const result = verifyToken(req, res)
      
      if (!result.ok) {
        return res.status(401).json({ ok: false, error: result.error, message: result.message })
      }
      
      return res.status(200).json({
        ok: true,
        message: '退出成功'
      })
    }
    
    if (action === 'verify' && req.method === 'GET') {
      const result = verifyToken(req, res)
      
      if (!result.ok) {
        return res.status(401).json({ ok: false, error: result.error, message: result.message })
      }
      
      const user = await getUserById(result.userId)
      
      if (!user) {
        return res.status(401).json({ ok: false, error: 'USER_NOT_FOUND', message: '用户不存在' })
      }
      
      return res.status(200).json({
        ok: true,
        user
      })
    }
    
    return res.status(404).json({ ok: false, error: 'NOT_FOUND', message: '接口不存在' })
  } catch (err) {
    console.error('Auth error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
