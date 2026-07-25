const { applyCors } = require('./_util/cors')
const { verifyToken } = require('./_util/auth')
const { getCollection } = require('./_util/db')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  try {
    const authResult = verifyToken(req, res)
    
    if (!authResult.ok) {
      return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
    }
    
    const userId = authResult.userId
    
    if (req.method === 'GET') {
      const collection = await getCollection('zzyy_auth', 'user_profiles')
      const profile = await collection.findOne({ userId })
      
      if (!profile) {
        return res.status(200).json({
          ok: true,
          profile: {
            userId,
            name: '',
            title: '',
            bio: '',
            phone: '',
            email: '',
            birthDate: '',
            educationLevel: '',
            wechat: '',
            qq: '',
            weibo: '',
            avatar: '',
            idPhoto: '',
            lifePhoto: '',
            wechatQr: '',
            qqQr: '',
            weiboQr: '',
            resumeUrl: '',
            resumeFilename: '',
            portfolioUrls: [],
            strengths: [],
            skills: [],
            workExperiences: [],
            internships: [],
            projects: [],
            education: [],
            papers: [],
            intellectualProperties: [],
            certifications: [],
            awards: [],
            updatedAt: new Date()
          }
        })
      }
      
      delete profile._id
      
      return res.status(200).json({
        ok: true,
        profile
      })
    } else if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const profileData = { ...body, userId, updatedAt: new Date() }
      
      const collection = await getCollection('zzyy_auth', 'user_profiles')
      
      await collection.updateOne(
        { userId },
        { $set: profileData },
        { upsert: true }
      )
      
      delete profileData._id
      
      return res.status(200).json({
        ok: true,
        profile: profileData,
        message: '保存成功'
      })
    } else {
      return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持GET和POST方法' })
    }
  } catch (err) {
    console.error('Profile error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}