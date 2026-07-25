const { applyCors } = require('../_util/cors')
const { verifyToken } = require('../_util/auth')
const { getCollection } = require('../_util/db')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持DELETE方法' })
  }
  
  try {
    const authResult = verifyToken(req, res)
    
    if (!authResult.ok) {
      return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
    }
    
    const pageId = req.query.pageId || req.params.pageId
    
    if (!pageId) {
      return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供页面ID' })
    }
    
    const collection = await getCollection('profile_builder', 'pages')
    const page = await collection.findOne({ pageId, ownerId: authResult.userId })
    
    if (!page) {
      return res.status(404).json({ ok: false, error: 'PAGE_NOT_FOUND', message: '页面不存在或无权访问' })
    }
    
    await collection.deleteOne({ pageId, ownerId: authResult.userId })
    
    return res.status(200).json({
      ok: true,
      message: '删除成功'
    })
  } catch (err) {
    console.error('Delete page error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
