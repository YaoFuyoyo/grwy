const { applyCors } = require('./_util/cors')
const { getCollection } = require('./_util/db')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  const action = req.query.action || ''
  
  try {
    if (action === 'get' && req.method === 'GET') {
      const { userId } = req.query
      
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供示例用户ID' })
      }
      
      const collection = await getCollection('zzyy_auth', 'user_profiles')
      const example = await collection.findOne({ userId })
      
      if (!example) {
        return res.status(404).json({ ok: false, error: 'EXAMPLE_NOT_FOUND', message: '示例不存在' })
      }
      
      delete example._id
      
      return res.status(200).json({
        ok: true,
        example
      })
    }
    
    if (action === 'list' && req.method === 'GET') {
      const collection = await getCollection('profile_builder', 'pages')
      const examples = await collection.find({ ownerId: { $regex: '^EXAMPLE_' } })
        .sort({ createdAt: -1 })
        .toArray()
      
      const result = examples.map(page => {
        delete page._id
        delete page.passwordHash
        return {
          pageId: page.pageId,
          subdomain: page.subdomain,
          name: page.name,
          title: page.title,
          bio: page.bio,
          createdAt: page.createdAt
        }
      })
      
      return res.status(200).json({
        ok: true,
        examples: result
      })
    }
    
    return res.status(404).json({ ok: false, error: 'NOT_FOUND', message: '接口不存在' })
  } catch (err) {
    console.error('Examples API error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
