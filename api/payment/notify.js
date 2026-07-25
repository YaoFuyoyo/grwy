const { applyCors } = require('../_util/cors')
const { getCollection } = require('../_util/db')

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  if (req.method !== 'POST') {
    return res.status(405).send('只支持POST方法')
  }
  
  try {
    const body = JSON.parse(req.body)
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
  } catch (err) {
    console.error('Notify error:', err)
    return res.status(500).send('服务器错误')
  }
}
