const { applyCors } = require('../_util/cors')
const { getCollection } = require('../_util/db')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持GET方法' })
  }
  
  try {
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
  } catch (err) {
    console.error('Get example error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
