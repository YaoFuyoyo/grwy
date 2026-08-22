const DypnsapiClient = require('@alicloud/dypnsapi20170525').default
const { CheckSmsVerifyCodeRequest } = require('@alicloud/dypnsapi20170525')
const { getCollection } = require('./db')

const SMS_EXPIRE_MS = 5 * 60 * 1000

let dypnsClient = null

let ttlIndexReady = false

async function ensureCodeTtlIndex() {
  if (ttlIndexReady) return
  const collection = await getCollection('zzyy_auth', 'sms_codes')
  try {
    // MongoDB 上让 expiresAt 到期的验证码自动删除，避免数据累积
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  } catch (e) {
    // 本地内存模式不支持 createIndex，忽略
  }
  ttlIndexReady = true
}

function initClient() {
  if (dypnsClient) return
  const akId = process.env.ALIYUN_ACCESS_KEY_ID
  const akSecret = process.env.ALIYUN_ACCESS_KEY_SECRET
  if (!akId || !akSecret) {
    throw new Error('Aliyun AK not configured')
  }
  dypnsClient = new DypnsapiClient({
    accessKeyId: akId,
    accessKeySecret: akSecret,
    endpoint: 'dypnsapi.aliyuncs.com'
  })
}

async function checkSmsCode(phone, code) {
  initClient()
  const request = new CheckSmsVerifyCodeRequest({ phoneNumber: phone, verifyCode: code })
  try {
    const response = await dypnsClient.checkSmsVerifyCode(request)
    return response.body || response
  } catch (err) {
    if (err.code === 'isv.ValidateFail') {
      return { success: false, code: err.code, message: err.message, model: { verifyResult: 'FAIL' } }
    }
    throw err
  }
}

async function storeVerifiedCode(phone, scene, code) {
  await ensureCodeTtlIndex()
  const collection = await getCollection('zzyy_auth', 'sms_codes')
  const expiresAt = Date.now() + SMS_EXPIRE_MS
  await collection.updateOne(
    { phone, scene },
    { $set: { code, expiresAt, phone, scene } },
    { upsert: true }
  )
  console.log('[SMS] Stored code:', { phone, scene, expiresAt: new Date(expiresAt).toISOString() })
}

async function consumeVerifiedCode(phone, scene, code) {
  const collection = await getCollection('zzyy_auth', 'sms_codes')
  const entry = await collection.findOne({ phone, scene })
  console.log('[SMS] Consume check:', { phone, scene, inputCode: code, found: !!entry })
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    await collection.deleteOne({ phone, scene })
    console.log('[SMS] Code expired for key:', `${phone}_${scene}`)
    return false
  }
  if (entry.code === code) {
    await collection.deleteOne({ phone, scene })
    console.log('[SMS] Code matched and consumed for key:', `${phone}_${scene}`)
    return true
  }
  console.log('[SMS] Code mismatch')
  return false
}

module.exports = { checkSmsCode, storeVerifiedCode, consumeVerifiedCode, SMS_EXPIRE_MS }