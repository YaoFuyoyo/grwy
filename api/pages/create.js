const { applyCors } = require('../_util/cors')
const { verifyToken } = require('../_util/auth')
const { getCollection, generatePageId } = require('../_util/db')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持POST方法' })
  }
  
  try {
    const authResult = verifyToken(req, res)
    
    if (!authResult.ok) {
      return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
    }
    
    const body = JSON.parse(req.body)
    const { subdomain, config, ...profileData } = body
    
    if (!subdomain || !config) {
      return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供网址参数和配置' })
    }
    
    const subdomainRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({ ok: false, error: 'INVALID_SUBDOMAIN', message: '网址参数只能包含字母、数字、下划线和短横线，长度3-20位' })
    }
    
    const pagesCollection = await getCollection('profile_builder', 'pages')
    const existing = await pagesCollection.findOne({ subdomain })
    
    if (existing) {
      return res.status(409).json({ ok: false, error: 'SUBDOMAIN_EXISTS', message: '该网址已被使用' })
    }
    
    const pageId = await generatePageId()
    
    const pageData = {
      ownerId: authResult.userId,
      pageId,
      subdomain,
      config,
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await pagesCollection.insertOne(pageData)
    delete pageData._id
    
    const pageUrl = `${req.headers.host}/${subdomain}/${pageId}`
    
    return res.status(200).json({
      ok: true,
      url: pageUrl,
      page: pageData,
      message: '页面创建成功'
    })
  } catch (err) {
    console.error('Create page error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
