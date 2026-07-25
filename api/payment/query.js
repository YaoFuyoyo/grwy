const { applyCors } = require('../_util/cors')
const { verifyToken } = require('../_util/auth')
const { getCollection } = require('../_util/db')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', message: '只支持GET方法' })
  }
  
  try {
    const authResult = verifyToken(req, res)
    
    if (!authResult.ok) {
      return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
    }
    
    const { orderId } = req.query
    
    if (!orderId) {
      return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供订单ID' })
    }
    
    const collection = await getCollection('zzyy_payment', 'orders')
    const order = await collection.findOne({ orderId })
    
    if (!order) {
      return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND', message: '订单不存在' })
    }
    
    delete order._id
    
    return res.status(200).json({
      ok: true,
      order
    })
  } catch (err) {
    console.error('Query order error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
