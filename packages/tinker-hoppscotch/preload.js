// HTTP request hook for Hoppscotch
// This provides the ability to make HTTP requests without CORS restrictions
// Using Node.js http/https modules in Electron preload context

const { contextBridge } = require('electron')
const http = require('http')
const https = require('https')
const { URL } = require('url')

// Helper: Convert Node.js Buffer to ArrayBuffer
function bufferToArrayBuffer(buffer) {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  )
}

// Helper: Create error response
function createErrorResponse(message, statusText = 'Error') {
  return {
    headers: {},
    status: 500,
    statusText,
    data: bufferToArrayBuffer(Buffer.from(message)),
  }
}

// Helper: Normalize headers (convert arrays to strings)
function normalizeHeaders(headers) {
  const normalized = {}
  for (const [key, value] of Object.entries(headers)) {
    normalized[key] = Array.isArray(value) ? value.join('\n') : value
  }
  return normalized
}

// Send HTTP request using Node.js http/https modules
async function sendRequest(config) {
  return new Promise((resolve) => {
    try {
      const { url, method, headers, data } = config
      const parsedUrl = new URL(url)
      const httpModule = parsedUrl.protocol === 'https:' ? https : http
      const body = method !== 'GET' && method !== 'HEAD' && data ? data : null

      const startTime = Date.now()

      const req = httpModule.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: method || 'GET',
          headers: headers || {},
        },
        (res) => {
          const chunks = []

          res.on('data', (chunk) => chunks.push(chunk))

          res.on('end', () => {
            const endTime = Date.now()
            const responseData = Buffer.concat(chunks)

            console.info('[Hoppscotch] Request completed:', {
              url,
              method,
              status: res.statusCode,
              time: endTime - startTime,
            })

            resolve({
              headers: normalizeHeaders(res.headers || {}),
              status: res.statusCode,
              statusText: res.statusMessage || '',
              data: bufferToArrayBuffer(responseData),
              config: { timeData: { startTime, endTime } },
            })
          })
        }
      )

      req.on('error', (error) => {
        console.error('[Hoppscotch] Request error:', error)
        resolve(
          createErrorResponse(
            `Request failed: ${error.message}`,
            'Network Error'
          )
        )
      })

      if (body) req.write(body)
      req.end()
    } catch (error) {
      console.error('[Hoppscotch] Request setup error:', error)
      resolve(createErrorResponse(`Request failed: ${error.message}`))
    }
  })
}

// Expose Hoppscotch extension hook
contextBridge.exposeInMainWorld('__POSTWOMAN_EXTENSION_HOOK__', {
  cancelRequest: () => console.info('[Hoppscotch] Cancel request called'),
  sendRequest: (config) => sendRequest(config),
  getVersion: () => ({ major: 0, minor: 1 }),
})

// Expose extension status proxy
contextBridge.exposeInMainWorld('__HOPP_EXTENSION_STATUS_PROXY__', {
  status: 'available',
  _subscribers: {},
  subscribe(prop, func) {
    const subscribers = this._subscribers
    if (Array.isArray(subscribers[prop])) {
      subscribers[prop].push(func)
    } else {
      subscribers[prop] = [func]
    }
  },
})

console.info('[Hoppscotch] Extension hook initialized with Node.js HTTP')
