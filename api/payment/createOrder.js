const { applyCors } = require('../_util/cors')
const { verifyToken } = require('../_util/auth')
const { getCollection, generateOrderId } = require('../_util/db')

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
  } catch (err) {
    console.error('Create order error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
