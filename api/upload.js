const { applyCors } = require('./_util/cors')

function base64ToBuffer(fileData) {
  const base64 = fileData.includes(',') ? fileData.split(',')[1] : fileData
  return Buffer.from(base64, 'base64')
}

module.exports = async (req, res) => {
  if (applyCors(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持POST方法' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { fileData, filename, fileType } = body

    if (!fileData || !filename) {
      return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供文件数据和文件名' })
    }

    const extension = filename.split('.').pop() || 'png'
    const safeName = filename.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_')
    const newFilename = `${Date.now()}-${safeName}`

    // 优先使用 Vercel Blob 存储
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = require('@vercel/blob')
        const buffer = base64ToBuffer(fileData)
        const blob = await put(newFilename, buffer, {
          access: 'public',
          contentType: fileType || `application/octet-stream`
        })
        return res.status(200).json({
          ok: true,
          url: blob.url,
          filename: newFilename,
          message: '上传成功'
        })
      } catch (blobErr) {
        console.error('Vercel Blob upload error:', blobErr)
        // 回退到 base64 模式，保证本地调试可用
      }
    }

    // 本地调试或无 Blob token 时回退
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
