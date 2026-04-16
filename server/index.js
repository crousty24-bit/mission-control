import { createServer } from 'node:http'
import { initDatabase } from './db/init.js'
import { serverConfig } from './config.js'
import { handleApiRequest } from './routes/api.js'
import { serveStaticAsset } from './utils/static.js'
import { sendText } from './utils/http.js'

initDatabase()

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendText(response, 400, 'Invalid request')
    return
  }

  const url = new URL(request.url, `http://${serverConfig.host}:${serverConfig.port}`)

  try {
    const handled = await handleApiRequest(request, response, url)
    if (!handled) {
      if (request.method === 'GET' || request.method === 'HEAD') {
        serveStaticAsset(response, url.pathname)
        return
      }

      sendText(response, 404, 'Not found')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    sendText(response, 500, message)
  }
})

server.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`Mission Control listening on ${serverConfig.appUrl}`)
})
