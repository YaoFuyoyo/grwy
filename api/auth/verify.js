const { applyCors } = require('../_util/cors')
const { verifyToken, getUserById } = require('../_util/auth')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持GET方法' })
  }
  
  try {
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
  } catch (err) {
    console.error('Verify error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
