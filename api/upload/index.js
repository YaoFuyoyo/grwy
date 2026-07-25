const { applyCors } = require('../_util/cors')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持POST方法' })
  }
  
  try {
    const body = JSON.parse(req.body)
    const { fileData, filename, fileType } = body
    
    if (!fileData || !filename) {
      return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供文件数据和文件名' })
    }
    
    const now = Date.now()
    const extension = filename.split('.').pop() || 'png'
    const newFilename = `${now}.${extension}`
    
    return res.status(200).json({
      ok: true,
      url: fileData,
      filename: newFilename,
      message: '上传成功'
    })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
