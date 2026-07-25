const { applyCors } = require('./_util/cors')
const { verifyToken } = require('./_util/auth')
const { getCollection, generateOrderId } = require('./_util/db')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  const action = req.query.action || ''
  
  try {
    if (action === 'create' && req.method === 'POST') {
      const authResult = verifyToken(req, res)
      
      if (!authResult.ok) {
        return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
      }
      
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { productType, amount } = body
      
      if (!productType) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供产品类型' })
      }
      
      const orderId = await generateOrderId()
      const orderAmount = amount || 1990
      
      const order = {
        orderId,
        userId: authResult.userId,
        productType,
        productName: '生成个人网页',
        amount: orderAmount,
        currency: 'CNY',
        status: 'pending',
        payChannel: '',
        payTime: null,
        thirdPartyOrderId: '',
        createdAt: new Date()
      }
      
      const collection = await getCollection('zzyy_payment', 'orders')
      await collection.insertOne(order)
      
      return res.status(200).json({
        ok: true,
        orderId,
        payData: {
          type: 'qrcode',
          content: 'https://grwy.zzyy99.cn/api/payment/qrcode?orderId=' + orderId
        },
        message: '订单创建成功'
      })
    }
    
    if (action === 'query' && req.method === 'GET') {
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
    }
    
    if (action === 'notify' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { orderId, status, payChannel, thirdPartyOrderId } = body
      
      if (!orderId || !status) {
        return res.status(400).send('缺少参数')
      }
      
      const collection = await getCollection('zzyy_payment', 'orders')
      const order = await collection.findOne({ orderId })
      
      if (!order) {
        return res.status(404).send('订单不存在')
      }
      
      await collection.updateOne(
        { orderId },
        {
          $set: {
            status,
            payChannel: payChannel || order.payChannel,
            thirdPartyOrderId: thirdPartyOrderId || order.thirdPartyOrderId,
            payTime: status === 'paid' ? new Date() : order.payTime
          }
        }
      )
      
      return res.status(200).send('success')
    }
    
    return res.status(404).json({ ok: false, error: 'NOT_FOUND', message: '接口不存在' })
  } catch (err) {
    console.error('Payment API error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
