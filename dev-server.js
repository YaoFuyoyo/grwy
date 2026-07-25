const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 3000

const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=').map(s => s.trim())
    if (key && value) {
      process.env[key] = value
    }
  })
}

function getContentType(filePath) {
  const extname = path.extname(filePath)
  switch (extname) {
    case '.html': return 'text/html'
    case '.css': return 'text/css'
    case '.js': return 'text/javascript'
    case '.json': return 'application/json'
    default: return 'application/octet-stream'
  }
}

function createVercelResponse(originalRes) {
  const vercelRes = {
    _statusCode: 200,
    _headers: {},
    
    status(code) {
      this._statusCode = code
      return this
    },
    
    json(obj) {
      this._headers['Content-Type'] = 'application/json'
      const body = JSON.stringify(obj)
      this.send(body)
    },
    
    send(body) {
      const headers = { ...this._headers }
      if (!headers['Content-Type']) {
        headers['Content-Type'] = typeof body === 'object' ? 'application/json' : 'text/html'
      }
      originalRes.writeHead(this._statusCode, headers)
      originalRes.end(typeof body === 'object' ? JSON.stringify(body) : body)
    },
    
    setHeader(name, value) {
      this._headers[name] = value
      return this
    }
  }
  
  return vercelRes
}

async function handleApiRequest(req, res, apiPath) {
  const parts = apiPath.split('/').filter(p => p)
  if (parts.length < 2) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: 'NOT_FOUND', message: 'API路径不存在' }))
    return
  }

  const moduleName = parts[0]
  const action = parts[1]
  
  let apiFilePath = path.join(__dirname, 'api', moduleName, action + '.js')
  
  if (!fs.existsSync(apiFilePath)) {
    apiFilePath = path.join(__dirname, 'api', moduleName, 'index.js')
    if (!fs.existsSync(apiFilePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'NOT_FOUND', message: 'API文件不存在' }))
      return
    }
  }

  let body = ''
  await new Promise((resolve) => {
    req.on('data', chunk => body += chunk)
    req.on('end', resolve)
  })

  try {
    req.body = body
    req.query = {}
    if (req.url.includes('?')) {
      const queryStr = req.url.split('?')[1]
      new URLSearchParams(queryStr).forEach((v, k) => { req.query[k] = v })
    }
    
    const vercelRes = createVercelResponse(res)
    
    console.log(`Loading API module: ${apiFilePath}`)
    const apiModule = require(apiFilePath)
    
    if (apiModule.default) {
      console.log('Using default export')
      await apiModule.default(req, vercelRes)
    } else {
      console.log('Using direct export')
      await apiModule(req, vercelRes)
    }
  } catch (err) {
    console.error('API Error:', err)
    console.error('Error stack:', err.stack)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误: ' + err.message }))
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host}`)

  if (url.pathname.startsWith('/api/')) {
    const apiPath = url.pathname.slice(4)
    await handleApiRequest(req, res, apiPath)
    return
  }

  let filePath = path.join(__dirname, 'public', url.pathname)
  
  if (filePath === path.join(__dirname, 'public', '/')) {
    filePath = path.join(__dirname, 'public', 'index.html')
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const contentType = getContentType(filePath)
    const content = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(content)
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end('<h1>Not Found</h1>')
  }
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})