const { applyCors } = require('./_util/cors')
const { checkSmsCode, storeVerifiedCode, consumeVerifiedCode } = require('./_util/sms-service')
const DypnsapiClient = require('@alicloud/dypnsapi20170525').default
const { SendSmsVerifyCodeRequest } = require('@alicloud/dypnsapi20170525')
const { RPCClient } = require('@alicloud/pop-core')

const SCENE_TEMPLATES = {
  login: process.env.ALIYUN_SMS_TEMPLATE_LOGIN || '100001',
  register: process.env.ALIYUN_SMS_TEMPLATE_LOGIN || '100001',
  changePhone: process.env.ALIYUN_SMS_TEMPLATE_CHANGE_PHONE || '100002',
  resetPassword: process.env.ALIYUN_SMS_TEMPLATE_RESET_PASSWORD || '100003',
  verifyPhone: process.env.ALIYUN_SMS_TEMPLATE_VERIFY_PHONE || '100005'
}

let dypnsClient = null
let captchaClient = null

const rateLimitStore = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 5

function initClients() {
  if (dypnsClient && captchaClient) return
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
  captchaClient = new RPCClient({
    accessKeyId: akId,
    accessKeySecret: akSecret,
    endpoint: 'https://captcha.cn-shanghai.aliyuncs.com',
    apiVersion: '2023-03-05'
  })
}

async function verifyCaptcha(captchaVerifyParam) {
  initClients()
  const params = {
    CaptchaVerifyParam: captchaVerifyParam,
    SceneId: process.env.ALIYUN_CAPTCHA_SCENE_ID
  }
  return await captchaClient.request('VerifyIntelligentCaptcha', params)
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function sendSmsCode(phone, scene) {
  initClients()
  const signName = process.env.ALIYUN_SMS_SIGN_NAME
  const templateCode = SCENE_TEMPLATES[scene]
  if (!templateCode) throw new Error('Invalid scene')

  const code = generateCode()
  const request = new SendSmsVerifyCodeRequest({
    phoneNumber: phone,
    signName,
    templateCode,
    templateParam: JSON.stringify({ code, min: '5' }),
    returnVerifyCode: true
  })
  const response = await dypnsClient.sendSmsVerifyCode(request)
  const body = response.body || response
  if (body && body.success === true) {
    await storeVerifiedCode(phone, scene, code)
  }
  return body
}

function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

function validateScene(scene) {
  return Object.prototype.hasOwnProperty.call(SCENE_TEMPLATES, scene)
}

function checkRateLimit(phone, scene) {
  const key = `rate_${phone}_${scene}`
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW
  const timestamps = (rateLimitStore.get(key) || []).filter(t => t > windowStart)
  if (timestamps.length >= RATE_LIMIT_MAX) return false
  timestamps.push(now)
  rateLimitStore.set(key, timestamps)
  return true
}

module.exports = async (req, res) => {
  if (applyCors(req, res)) return

  const action = req.query.action || ''

  try {
    if (action === 'send' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { phone, scene, captchaVerifyParam } = body

      if (!phone || !scene || !captchaVerifyParam) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '缺少必要参数' })
      }

      if (!validatePhone(phone)) {
        return res.status(400).json({ ok: false, error: 'INVALID_PHONE', message: '手机号格式不正确' })
      }

      if (!validateScene(scene)) {
        return res.status(400).json({ ok: false, error: 'INVALID_SCENE', message: '无效的验证码场景' })
      }

      if (!checkRateLimit(phone, scene)) {
        return res.status(429).json({ ok: false, error: 'RATE_LIMIT', message: '验证码发送过于频繁，请稍后再试' })
      }

      try {
        const captchaResult = await verifyCaptcha(captchaVerifyParam)
        if (!captchaResult || captchaResult.Success !== true || !captchaResult.Result || captchaResult.Result.VerifyResult !== true) {
          const verifyCode = captchaResult && captchaResult.Result && captchaResult.Result.VerifyCode
          const msg = verifyCode ? `图形验证失败 (${verifyCode})，请重试` : '图形验证失败，请重试'
          return res.status(400).json({ ok: false, error: 'CAPTCHA_FAILED', message: msg })
        }
      } catch (captchaErr) {
        console.error('Captcha verify error:', captchaErr.message, captchaErr.data ? JSON.stringify(captchaErr.data) : '')
        const errCode = captchaErr.code || (captchaErr.data && captchaErr.data.Code)
        let msg = '图形验证服务异常'
        if (errCode === 'InvalidAccessKeyId.NotFound' || errCode === 'InvalidSignature') {
          msg = '阿里云 AccessKey 无效或无验证码服务权限，请检查 AK 配置'
        } else if (errCode === 'SignatureDoesNotMatch') {
          msg = '阿里云签名校验失败，请检查 AK_SECRET 配置'
        } else if (captchaErr.message) {
          msg = `图形验证服务异常：${captchaErr.message}`
        }
        return res.status(400).json({ ok: false, error: 'CAPTCHA_ERROR', message: msg })
      }

      try {
        const smsResult = await sendSmsCode(phone, scene)
        if (smsResult && smsResult.success === true && smsResult.model && smsResult.model.bizId) {
          return res.status(200).json({ ok: true, message: '验证码已发送，请查收短信', bizId: smsResult.model.bizId })
        }
        const errCode = smsResult && smsResult.code
        const errMsg = smsResult && smsResult.message
        console.error('Send SMS failed:', errCode, errMsg, smsResult ? JSON.stringify(smsResult) : '')
        if (errCode === 'biz.FREQUENCY') {
          return res.status(429).json({ ok: false, error: 'SMS_FREQUENCY', message: '验证码发送过于频繁，请稍后再试' })
        }
        return res.status(500).json({ ok: false, error: 'SMS_SEND_FAILED', message: errMsg || '短信发送失败' })
      } catch (smsErr) {
        console.error('Send SMS error:', smsErr.message, smsErr.data ? JSON.stringify(smsErr.data) : '')
        return res.status(500).json({ ok: false, error: 'SMS_ERROR', message: `短信服务异常：${smsErr.message}` })
      }
    }

    if (action === 'verify' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { phone, scene, code } = body

      if (!phone || !scene || !code) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '缺少必要参数' })
      }

      if (!validatePhone(phone)) {
        return res.status(400).json({ ok: false, error: 'INVALID_PHONE', message: '手机号格式不正确' })
      }

      if (!validateScene(scene)) {
        return res.status(400).json({ ok: false, error: 'INVALID_SCENE', message: '无效的验证码场景' })
      }

      try {
        const localValid = await consumeVerifiedCode(phone, scene, code)
        if (localValid) {
          return res.status(200).json({ ok: true, message: '验证码验证成功' })
        }
        return res.status(400).json({ ok: false, error: 'CODE_INVALID', message: '验证码错误或已失效，请重新输入' })
      } catch (checkErr) {
        console.error('Check SMS error:', checkErr.message, checkErr.data ? JSON.stringify(checkErr.data) : '')
        return res.status(500).json({ ok: false, error: 'CHECK_ERROR', message: '验证码校验服务异常' })
      }
    }

    return res.status(404).json({ ok: false, error: 'NOT_FOUND', message: '接口不存在' })
  } catch (err) {
    console.error('SMS error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}