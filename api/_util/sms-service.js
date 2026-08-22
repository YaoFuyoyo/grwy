const DypnsapiClient = require('@alicloud/dypnsapi20170525').default
const { CheckSmsVerifyCodeRequest } = require('@alicloud/dypnsapi20170525')

const smsStore = new Map()

const SMS_EXPIRE_MS = 5 * 60 * 1000

let dypnsClient = null

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

function storeVerifiedCode(phone, scene, code) {
  const key = `${phone}_${scene}`
  const expiresAt = Date.now() + SMS_EXPIRE_MS
  smsStore.set(key, { code, expiresAt, phone, scene })
  console.log('[SMS] Stored code:', { key, code, expiresAt: new Date(expiresAt).toISOString() })
}

function consumeVerifiedCode(phone, scene, code) {
  const key = `${phone}_${scene}`
  const entry = smsStore.get(key)
  console.log('[SMS] Consume check:', { key, inputCode: code, entry: entry ? { storedCode: entry.code, expiresAt: new Date(entry.expiresAt).toISOString() } : null, storeKeys: [...smsStore.keys()] })
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    smsStore.delete(key)
    console.log('[SMS] Code expired for key:', key)
    return false
  }
  if (entry.code === code) {
    smsStore.delete(key)
    console.log('[SMS] Code matched and consumed for key:', key)
    return true
  }
  console.log('[SMS] Code mismatch:', { stored: entry.code, input: code })
  return false
}

module.exports = { checkSmsCode, storeVerifiedCode, consumeVerifiedCode, smsStore, SMS_EXPIRE_MS }