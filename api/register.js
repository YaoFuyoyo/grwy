const { getDb } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { 
      subdomain, 
      name, 
      title, 
      bio, 
      phone, 
      email, 
      birthDate, 
      educationLevel,
      wechat, 
      qq, 
      weibo,
      avatarUrl, 
      idPhotoUrl, 
      wechatQrUrl, 
      qqQrUrl, 
      weiboQrUrl,
      resumeUrl, 
      resumeFilename, 
      portfolioUrls,
      strengths,
      skills,
      workExperiences,
      education,
      papers,
      certifications,
      awards,
      templateId 
    } = body;

    if (!subdomain || !name) {
      return res.status(400).json({ ok: false, error: '缺少必填参数' });
    }

    const db = await getDb();
    const users = db.collection('users');
    const counters = db.collection('counters');

    const existUser = await users.findOne({ subdomain });
    if (existUser) {
      return res.json({ ok: false, error: '该网址已被使用，请更换' });
    }

    const counter = await counters.findOneAndUpdate(
      { name: 'user_id' },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const userId = counter.value || 1;
    const userIdStr = String(userId).padStart(6, '0');

    await users.insertOne({
      subdomain,
      userId: userIdStr,
      name,
      title: title || '',
      bio: bio || '',
      phone: phone || '',
      email: email || '',
      birthDate: birthDate || '',
      educationLevel: educationLevel || '',
      wechat: wechat || '',
      qq: qq || '',
      weibo: weibo || '',
      avatarUrl: avatarUrl || '',
      idPhotoUrl: idPhotoUrl || '',
      wechatQrUrl: wechatQrUrl || '',
      qqQrUrl: qqQrUrl || '',
      weiboQrUrl: weiboQrUrl || '',
      resumeUrl: resumeUrl || '',
      resumeFilename: resumeFilename || '简历.pdf',
      portfolioUrls: Array.isArray(portfolioUrls) ? portfolioUrls : [],
      strengths: Array.isArray(strengths) ? strengths : [],
      skills: Array.isArray(skills) ? skills : [],
      workExperiences: Array.isArray(workExperiences) ? workExperiences : [],
      education: Array.isArray(education) ? education : [],
      papers: Array.isArray(papers) ? papers : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      awards: Array.isArray(awards) ? awards : [],
      templateId: templateId || 'theme-simple-white',
      createdAt: new Date()
    });

    return res.status(200).json({
      ok: true,
      url: `https://grwy.zzyy99.cn/${subdomain}/${userIdStr}`
    });

  } catch (error) {
    console.log('register 错误:', error.message);
    return res.status(500).json({ ok: false, error: error.message });
  }
};
