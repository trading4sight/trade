import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs'
import { createServer, request } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST_DIR = resolve(fileURLToPath(new URL('.', import.meta.url)))
const DIST_DATA_DIR = resolve(DIST_DIR, 'data')
const PORT = Number.parseInt(process.env.PORT ?? '4173', 10)
const HOST = process.env.HOST ?? '0.0.0.0'
const TIMEFRAME_GROUP_ORDER = ['seconds', 'minutes', 'hours', 'days']

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
}

function buildDisplayName(folderName) {
  return folderName.includes('-') ? folderName.split('-')[0] ?? folderName : folderName
}

function parseFileCode(fileCode) {
  const normalized = fileCode.trim().toUpperCase()

  if (normalized === 'D') {
    return { durationMs: 24 * 60 * 60 * 1_000, group: 'days', normalized }
  }

  if (normalized === 'W') {
    return { durationMs: 7 * 24 * 60 * 60 * 1_000, group: 'days', normalized }
  }

  if (normalized === 'M') {
    return { durationMs: 30 * 24 * 60 * 60 * 1_000, group: 'days', normalized }
  }

  const secondMatch = normalized.match(/^(\d+)S$/)
  if (secondMatch) {
    const span = Number.parseInt(secondMatch[1], 10)
    return Number.isFinite(span) && span > 0
      ? { durationMs: span * 1_000, group: 'seconds', normalized }
      : null
  }

  const minuteMatch = normalized.match(/^(\d+)$/)
  if (!minuteMatch) {
    return null
  }

  const span = Number.parseInt(minuteMatch[1], 10)
  if (!Number.isFinite(span) || span <= 0) {
    return null
  }

  return {
    durationMs: span * 60 * 1_000,
    group: span >= 60 ? 'hours' : 'minutes',
    normalized,
  }
}

function compareFileCodes(left, right) {
  const leftTimeframe = parseFileCode(left)
  const rightTimeframe = parseFileCode(right)

  if (!leftTimeframe && !rightTimeframe) {
    return left.localeCompare(right)
  }

  if (!leftTimeframe) {
    return 1
  }

  if (!rightTimeframe) {
    return -1
  }

  const groupDelta = TIMEFRAME_GROUP_ORDER.indexOf(leftTimeframe.group) - TIMEFRAME_GROUP_ORDER.indexOf(rightTimeframe.group)
  if (groupDelta !== 0) {
    return groupDelta
  }

  const durationDelta = leftTimeframe.durationMs - rightTimeframe.durationMs
  if (durationDelta !== 0) {
    return durationDelta
  }

  return leftTimeframe.normalized.localeCompare(rightTimeframe.normalized)
}

function sortFileCodes(fileCodes) {
  return [...new Set(fileCodes)]
    .map((fileCode) => parseFileCode(fileCode)?.normalized ?? fileCode)
    .filter((fileCode) => parseFileCode(fileCode))
    .sort(compareFileCodes)
}

function parseCsvMetadata(folderName, csvFileName) {
  const fileName = csvFileName.replace(/\.csv$/i, '')
  const prefix = `${folderName}-`
  if (!fileName.startsWith(prefix)) {
    return null
  }

  const remainder = fileName.slice(prefix.length)
  const separatorIndex = remainder.lastIndexOf('-')
  if (separatorIndex <= 0) {
    return null
  }

  const fileCode = remainder.slice(0, separatorIndex)
  const exchange = remainder.slice(separatorIndex + 1)
  const parsedFileCode = parseFileCode(fileCode)
  if (!parsedFileCode || exchange.length === 0) {
    return null
  }

  return {
    exchange,
    fileCode: parsedFileCode.normalized,
  }
}

function buildSymbolsManifest() {
  if (!existsSync(DIST_DATA_DIR)) {
    return []
  }

  const entries = new Map()

  readdirSync(DIST_DATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((directory) => {
      const folderName = directory.name
      const folderDir = resolve(DIST_DATA_DIR, folderName)

      readdirSync(folderDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.csv'))
        .forEach((file) => {
          const metadata = parseCsvMetadata(folderName, file.name)
          if (!metadata) {
            return
          }

          const currentEntry = entries.get(folderName)
          if (currentEntry) {
            currentEntry.fileCodes.add(metadata.fileCode)
            return
          }

          entries.set(folderName, {
            symbol: folderName,
            exchange: metadata.exchange,
            displayName: buildDisplayName(folderName),
            liveSymbol: buildDisplayName(folderName),
            fileCodes: new Set([metadata.fileCode]),
          })
        })
    })

  return [...entries.values()]
    .map((entry) => ({
      ...entry,
      fileCodes: sortFileCodes([...entry.fileCodes]),
    }))
    .sort((left, right) => left.symbol.localeCompare(right.symbol))
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(message)
}

function safeResolve(baseDir, pathname) {
  const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  const resolvedPath = resolve(baseDir, `.${normalizedPath}`)
  return resolvedPath.startsWith(baseDir) ? resolvedPath : null
}

function serveFile(res, absolutePath) {
  const extension = extname(absolutePath).toLowerCase()
  const contentType = CONTENT_TYPES[extension] ?? 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': contentType })
  createReadStream(absolutePath).pipe(res)
}

if (!existsSync(DIST_DATA_DIR)) {
  console.error('dist/data was not found. Rebuild the app package first.')
  process.exit(1)
}

const server = createServer((req, res) => {
  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const pathname = requestUrl.pathname

  if (pathname === '/data/symbols-manifest.json') {
    sendJson(res, 200, buildSymbolsManifest())
    return
  }

  if (pathname.startsWith('/api/')) {
    const targetUrl = new URL(req.url ?? '', 'http://127.0.0.1:5000')
    const proxyReq = request(
      {
        host: '127.0.0.1',
        port: 5000,
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: req.headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers)
        proxyRes.pipe(res)
      }
    )
    proxyReq.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Proxy Error: ' + err.message)
    })
    req.pipe(proxyReq)
    return
  }

  const baseDir = pathname.startsWith('/data/') ? DIST_DATA_DIR : DIST_DIR
  const relativePath = pathname.startsWith('/data/')
    ? pathname.slice('/data'.length)
    : pathname === '/'
      ? '/index.html'
      : pathname

  let targetPath = safeResolve(baseDir, relativePath)
  if (!targetPath) {
    sendText(res, 403, 'Forbidden')
    return
  }

  if (existsSync(targetPath) && statSync(targetPath).isDirectory()) {
    targetPath = join(targetPath, 'index.html')
  }

  if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
    const fallbackPath = resolve(DIST_DIR, 'index.html')
    if (pathname.startsWith('/data/')) {
      sendText(res, 404, 'Not found')
      return
    }

    serveFile(res, fallbackPath)
    return
  }

  serveFile(res, targetPath)
})

server.listen(PORT, HOST, () => {
  console.log(`YSTC CHARTS dist server running at http://localhost:${PORT}`)
  console.log(`Paste tester CSV folders into ${DIST_DATA_DIR}`)
})
