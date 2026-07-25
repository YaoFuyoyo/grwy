const { applyCors } = require('../_util/cors')
const { verifyToken } = require('../_util/auth')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持POST方法' })
  }
  
  try {
    const result = verifyToken(req, res)
    
    if (!result.ok) {
      return res.status(401).json({ ok: false, error: result.error, message: result.message })
    }
    
    return res.status(200).json({
      ok: true,
      message: '退出成功'
    })
  } catch (err) {
    console.error('Logout error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
