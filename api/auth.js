const bcrypt = require('bcryptjs')
const { applyCors } = require('./_util/cors')
const { getCollection, generateUserId } = require('./_util/db')
const { generateToken, verifyToken, getUserById } = require('./_util/auth')
const { consumeVerifiedCode } = require('./_util/sms-service')

const SCENE_MAP = {
  'login-sms': 'login',
  'register-sms': 'register',
  'reset-password': 'resetPassword',
  'change-phone': 'changePhone'
}

module.exports = async (req, res) => {
  if (applyCors(req, res)) return

  const action = req.query.action || ''

  try {
    if (action === 'login-sms' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { phone, code } = body

      if (!phone || !code) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请填写手机号和验证码' })
      }

      const scene = SCENE_MAP[action]
      const valid = consumeVerifiedCode(phone, scene, code)
      if (!valid) {
        return res.status(401).json({ ok: false, error: 'CODE_INVALID', message: '验证码错误或已失效' })
      }

      const collection = await getCollection('zzyy_auth', 'accounts')
      const user = await collection.findOne({ phone })

      if (!user) {
        return res.status(401).json({ ok: false, error: 'USER_NOT_FOUND', message: '该手机号尚未注册，请先注册' })
      }

      if (user.status !== 'active') {
        return res.status(401).json({ ok: false, error: 'USER_DISABLED', message: '账号已禁用' })
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

    if (action === 'register-sms' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { phone, code, name, password } = body

      if (!phone || !code || !name || !password) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请填写完整信息' })
      }

      const phoneRegex = /^1[3-9]\d{9}$/
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ ok: false, error: 'INVALID_PHONE', message: '请输入正确的手机号' })
      }

      if (password.length < 6) {
        return res.status(400).json({ ok: false, error: 'INVALID_PASSWORD', message: '密码至少6位' })
      }

      const scene = SCENE_MAP[action]
      const valid = consumeVerifiedCode(phone, scene, code)
      if (!valid) {
        return res.status(401).json({ ok: false, error: 'CODE_INVALID', message: '验证码错误或已失效' })
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

    if (action === 'reset-password' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { phone: bodyPhone, code, newPassword } = body

      if (!code || !newPassword) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请填写验证码和新密码' })
      }

      let phone = bodyPhone

      if (!phone) {
        const authResult = verifyToken(req, res)
        if (!authResult.ok) {
          return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
        }
        phone = authResult.user.phone
      }

      if (!phone) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '缺少手机号参数' })
      }

      const phoneRegex = /^1[3-9]\d{9}$/
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ ok: false, error: 'INVALID_PHONE', message: '请输入正确的手机号' })
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ ok: false, error: 'INVALID_PASSWORD', message: '密码至少6位' })
      }

      const scene = SCENE_MAP[action]
      const valid = consumeVerifiedCode(phone, scene, code)
      if (!valid) {
        return res.status(401).json({ ok: false, error: 'CODE_INVALID', message: '验证码错误或已失效' })
      }

      const collection = await getCollection('zzyy_auth', 'accounts')
      const user = await collection.findOne({ phone })

      if (!user) {
        return res.status(401).json({ ok: false, error: 'USER_NOT_FOUND', message: '该手机号未注册' })
      }

      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(newPassword, salt)

      await collection.updateOne(
        { phone },
        { $set: { passwordHash, updatedAt: new Date() } }
      )

      return res.status(200).json({ ok: true, message: '密码重置成功' })
    }

    if (action === 'change-phone' && req.method === 'POST') {
      const authResult = verifyToken(req, res)
      if (!authResult.ok) {
        return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { newPhone, code } = body

      if (!newPhone || !code) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请填写新手机号和验证码' })
      }

      const phoneRegex = /^1[3-9]\d{9}$/
      if (!phoneRegex.test(newPhone)) {
        return res.status(400).json({ ok: false, error: 'INVALID_PHONE', message: '请输入正确的手机号' })
      }

      const scene = SCENE_MAP[action]
      const valid = consumeVerifiedCode(newPhone, scene, code)
      if (!valid) {
        return res.status(401).json({ ok: false, error: 'CODE_INVALID', message: '验证码错误或已失效' })
      }

      const collection = await getCollection('zzyy_auth', 'accounts')
      const existing = await collection.findOne({ phone: newPhone })

      if (existing) {
        return res.status(409).json({ ok: false, error: 'USER_EXISTS', message: '该手机号已被其他账号绑定' })
      }

      await collection.updateOne(
        { userId: authResult.userId },
        { $set: { phone: newPhone, updatedAt: new Date() } }
      )

      return res.status(200).json({ ok: true, message: '手机号修改成功' })
    }

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
      return res.status(200).json({ ok: true, message: '退出成功' })
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
      return res.status(200).json({ ok: true, user })
    }

    if (action === 'update-name' && req.method === 'POST') {
      const authResult = verifyToken(req, res)
      if (!authResult.ok) {
        return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { name } = body

      if (!name || typeof name !== 'string') {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请输入用户名' })
      }

      const trimmed = name.trim()
      if (trimmed.length < 1 || trimmed.length > 20) {
        return res.status(400).json({ ok: false, error: 'INVALID_NAME', message: '用户名长度需在1-20个字符之间' })
      }

      const collection = await getCollection('zzyy_auth', 'accounts')
      await collection.updateOne(
        { userId: authResult.userId },
        { $set: { name: trimmed, updatedAt: new Date() } }
      )

      return res.status(200).json({ ok: true, name: trimmed, message: '用户名修改成功' })
    }

    if (action === 'update-avatar' && req.method === 'POST') {
      const authResult = verifyToken(req, res)
      if (!authResult.ok) {
        return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { avatar } = body

      if (!avatar || typeof avatar !== 'string') {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供头像' })
      }

      const collection = await getCollection('zzyy_auth', 'accounts')
      await collection.updateOne(
        { userId: authResult.userId },
        { $set: { avatar, updatedAt: new Date() } }
      )

      return res.status(200).json({ ok: true, avatar, message: '头像修改成功' })
    }

    return res.status(404).json({ ok: false, error: 'NOT_FOUND', message: '接口不存在' })
  } catch (err) {
    console.error('Auth error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}