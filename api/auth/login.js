const bcrypt = require('bcryptjs')
const { applyCors } = require('../_util/cors')
const { getCollection } = require('../_util/db')
const { generateToken } = require('../_util/auth')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持POST方法' })
  }
  
  try {
    const body = JSON.parse(req.body)
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
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
