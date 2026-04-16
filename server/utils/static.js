import { existsSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { serverConfig } from '../config.js'

const mimeByExtension = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

function getContentType(filePath) {
  return mimeByExtension[extname(filePath)] ?? 'application/octet-stream'
}

function sendBuffer(response, statusCode, contentType, buffer) {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
  })
  response.end(buffer)
}

export function serveStaticAsset(response, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname
  const requestedPath = join(serverConfig.distPath, safePath)

  if (existsSync(requestedPath)) {
    sendBuffer(
      response,
      200,
      getContentType(requestedPath),
      readFileSync(requestedPath),
    )
    return true
  }

  if (pathname.startsWith('/assets/')) {
    return false
  }

  const indexPath = join(serverConfig.distPath, 'index.html')
  if (!existsSync(indexPath)) {
    const message = `
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Mission Control</title>
  </head>
  <body style="font-family: sans-serif; background:#120d0a; color:#fff5eb; padding:2rem;">
    <h1>Mission Control</h1>
    <p>Le build front est introuvable.</p>
    <p>Exécute <code>npm run build</code> puis relance <code>npm run app</code>.</p>
  </body>
</html>`
    sendBuffer(response, 503, 'text/html; charset=utf-8', Buffer.from(message))
    return true
  }

  sendBuffer(response, 200, 'text/html; charset=utf-8', readFileSync(indexPath))
  return true
}
