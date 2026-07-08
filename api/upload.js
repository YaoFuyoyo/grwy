const { getDb } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // Vercel 中文件上传需要用 multipart/form-data
    // 这里简化处理，前端把文件转成 base64 直接传
    const body = req.body || {};
    const { fileData, filename } = body;

    if (!fileData) {
      return res.status(400).json({ ok: false, error: '没有上传文件' });
    }

    return res.json({
      ok: true,
      url: fileData,
      filename: filename || 'unnamed'
    });

  } catch (error) {
    console.log('上传错误:', error.message);
    return res.status(500).json({ ok: false, error: error.message });
  }
};