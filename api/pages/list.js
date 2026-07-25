const { applyCors } = require('../_util/cors')
const { verifyToken } = require('../_util/auth')
const { getCollection } = require('../_util/db')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持GET方法' })
  }
  
  try {
    const authResult = verifyToken(req, res)
    
    if (!authResult.ok) {
      return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
    }
    
    const collection = await getCollection('profile_builder', 'pages')
    const pages = await collection.find({ ownerId: authResult.userId })
      .sort({ createdAt: -1 })
      .toArray()
    
    const result = pages.map(page => {
      delete page._id
      delete page.passwordHash
      return page
    })
    
    return res.status(200).json({
      ok: true,
      pages: result
    })
  } catch (err) {
    console.error('List pages error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
