const { applyCors } = require('../_util/cors')
const { getCollection } = require('../_util/db')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持GET方法' })
  }
  
  try {
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
  } catch (err) {
    console.error('List examples error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
