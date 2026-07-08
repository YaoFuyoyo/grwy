const { getDb } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const body = req.body || {};
    const { subdomain, name, title, bio, email, phone, resumeUrl, resumeFilename, portfolioUrls, templateId } = body;

    if (!subdomain || !name) {
      return res.status(400).json({ ok: false, error: '缺少必填参数' });
    }

    const db = await getDb();
    const users = db.collection('users');
    const counters = db.collection('counters');

    // 检查子域名是否被占用
    const existUser = await users.findOne({ subdomain });
    if (existUser) {
      return res.json({ ok: false, error: '该网址已被使用，请更换' });
    }

    // 生成6位自增序号
    const counter = await counters.findOneAndUpdate(
      { name: 'user_id' },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const userId = counter.value || 1;
    const userIdStr = String(userId).padStart(6, '0');

    // 创建用户
    await users.insertOne({
      subdomain,
      userId: userIdStr,
      name,
      title: title || '',
      bio: bio || '',
      email: email || '',
      phone: phone || '',
      resumeUrl: resumeUrl || '',
      resumeFilename: resumeFilename || '简历.pdf',
      portfolioUrls: portfolioUrls || [],
      templateId: templateId || 'template1',
      createdAt: new Date()
    });

    return res.json({
      ok: true,
      url: `https://grwy.zzyy99.cn/${subdomain}/${userIdStr}`
    });

  } catch (error) {
    console.log('register 错误:', error.message);
    return res.status(500).json({ ok: false, error: error.message });
  }
};