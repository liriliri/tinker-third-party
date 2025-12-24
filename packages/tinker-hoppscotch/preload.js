// HTTP request hook for Hoppscotch
// This provides the ability to make HTTP requests without CORS restrictions

async function renderer() {
  console.info('[Hoppscotch] Initializing extension hook')

  // Set up the extension hook
  window.__POSTWOMAN_EXTENSION_HOOK__ = {
    cancelRequest: () => {
      // TODO: Implement request cancellation if needed
      console.info('[Hoppscotch] Cancel request called')
    },

    sendRequest: async (config) => {
      try {
        const { url, method, headers, data } = config

        // Don't send body for GET/HEAD requests
        let body = data
        if (method === 'GET' || method === 'HEAD') {
          body = null
        }

        const startTime = Date.now()

        // Use native fetch API
        const response = await fetch(url, {
          method,
          headers,
          body,
          // Important: This allows requests to any origin
          mode: 'cors',
          credentials: 'omit',
        })

        const endTime = Date.now()

        // Get response data as ArrayBuffer
        const responseData = await response.arrayBuffer()

        // Convert headers to object
        const responseHeaders = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })

        console.info('[Hoppscotch] Request completed:', {
          url,
          method,
          status: response.status,
          time: endTime - startTime,
        })

        return {
          headers: responseHeaders,
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          config: {
            timeData: {
              startTime,
              endTime,
            },
          },
        }
      } catch (error) {
        console.error('[Hoppscotch] Request error:', error)
        return {
          headers: {},
          status: 500,
          statusText: 'Network Error',
          data: new TextEncoder().encode(`Request failed: ${error.message}`),
          config: {},
        }
      }
    },

    getVersion: () => ({ major: 0, minor: 1, patch: 0 }),
  }

  // Set extension status to available
  if (window.__HOPP_EXTENSION_STATUS_PROXY__) {
    window.__HOPP_EXTENSION_STATUS_PROXY__.status = 'available'
  } else {
    // Create the status proxy if it doesn't exist
    window.__HOPP_EXTENSION_STATUS_PROXY__ = {
      status: 'available',
      _subscribers: {},
      subscribe(prop, func) {
        if (Array.isArray(this._subscribers[prop])) {
          this._subscribers[prop].push(func)
        } else {
          this._subscribers[prop] = [func]
        }
      },
    }
  }

  console.info('[Hoppscotch] Extension hook initialized successfully')
}

document.onreadystatechange = () => {
  if (document.readyState === 'interactive') {
    const script = document.createElement('script')
    script.textContent = `(${renderer.toString()})()`
    document.documentElement.appendChild(script)
    document.documentElement.removeChild(script)
  }
}
