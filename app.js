// =============================================================================
// GRAND ADDIS HOTEL - Production Application Starter Script for Plesk
// =============================================================================
const path = require('path')
const fs = require('fs')

// Ensure working directory is always the application root
try {
  process.chdir(__dirname)
} catch (e) {
  console.warn('Failed to chdir to __dirname:', e)
}

// Load environment variables in priority order
try {
  const dotenv = require('dotenv')
  for (const envFile of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    const envPath = path.resolve(__dirname, envFile)
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath })
    }
  }
} catch (e) {
  console.warn('Failed to load dotenv:', e)
}

// ─── Sanitize database environment variables at the process level ───
// The cPanel "Setup Node.js App" UI or a server .env may inject malformed
// values such as DB_HOST="9223@localhost" (which causes getaddrinfo ENOTFOUND).
// We fix these BEFORE Next.js boots so every code path sees clean values.
function sanitizeEnvHost(envKey) {
  const raw = process.env[envKey]
  if (!raw) return
  let host = raw.trim()
  // Strip everything before the last '@' (e.g. "9223@localhost" → "localhost")
  if (host.includes('@')) {
    host = host.split('@').pop().trim()
    console.log(`[app.js] Sanitized ${envKey}: "${raw}" → "${host}"`)
  }
  // If host has an embedded port like "localhost:3306", split it out
  if (host.includes(':')) {
    const [h, p] = host.split(':')
    host = h.trim()
    if (!process.env.DB_PORT && !process.env.MYSQL_PORT) {
      const port = parseInt(p, 10)
      if (!isNaN(port) && port > 0 && port < 65536) {
        process.env.DB_PORT = String(port)
        console.log(`[app.js] Extracted DB_PORT=${port} from ${envKey}`)
      }
    }
  }
  // Normalize "localhost" → "127.0.0.1" to avoid IPv6/getaddrinfo issues
  if (host.toLowerCase() === 'localhost') {
    host = '127.0.0.1'
    console.log(`[app.js] Normalized ${envKey}: "localhost" → "127.0.0.1"`)
  }
  process.env[envKey] = host
}
sanitizeEnvHost('DB_HOST')
sanitizeEnvHost('MYSQL_HOST')
sanitizeEnvHost('PGHOST')
sanitizeEnvHost('POSTGRES_HOST')

// Also sanitize DATABASE_URL if it contains a malformed host
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@')) {
  try {
    const dbUrl = process.env.DATABASE_URL
    const protoMatch = dbUrl.match(/^([a-z0-9+.-]+):\/\//i)
    if (protoMatch) {
      const proto = protoMatch[1].toLowerCase()
      const rest = dbUrl.slice(protoMatch[0].length)
      const slashIdx = rest.indexOf('/')
      const hostAndAuth = slashIdx !== -1 ? rest.slice(0, slashIdx) : rest
      const pathAndQuery = slashIdx !== -1 ? rest.slice(slashIdx) : ''
      const lastAt = hostAndAuth.lastIndexOf('@')
      if (lastAt !== -1) {
        let hostPart = hostAndAuth.slice(lastAt + 1)
        if (hostPart.includes('@')) {
          hostPart = hostPart.split('@').pop().trim()
        }
        let [h, p] = hostPart.split(':')
        if (h && h.toLowerCase() === 'localhost') {
          h = '127.0.0.1'
        }
        hostPart = p ? `${h}:${p}` : h
        const auth = hostAndAuth.slice(0, lastAt)
        process.env.DATABASE_URL = `${proto}://${auth}@${hostPart}${pathAndQuery}`
        console.log(`[app.js] Sanitized DATABASE_URL (${proto}) host: "${hostPart}"`)
      }
    }
  } catch (e) {
    console.warn('[app.js] Failed to sanitize DATABASE_URL:', e.message)
  }
}

console.log('[app.js] DB config after sanitization:', {
  DB_HOST: process.env.DB_HOST || '(not set)',
  DB_PORT: process.env.DB_PORT || '(not set)',
  DB_USER: process.env.DB_USER || process.env.DB_USERNAME || '(not set)',
  DB_NAME: process.env.DB_NAME || process.env.DB_DATABASE || '(not set)',
  DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^@:]+)@/, ':***@') : '(not set)',
  MYSQL_HOST: process.env.MYSQL_HOST || '(not set)',
  NODE_ENV: process.env.NODE_ENV || '(not set)',
})

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// Configure Phusion Passenger if running inside Plesk Passenger runtime
if (typeof PhusionPassenger !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false })
}

const dev = process.env.NODE_ENV !== 'production'

// Determine listen target (Plesk Phusion Passenger passes 'passenger' or custom port)
const rawPort = process.env.PORT
let listenTarget = 3000

if (typeof PhusionPassenger !== 'undefined' || rawPort === 'passenger') {
  listenTarget = 'passenger'
} else if (rawPort) {
  const parsed = parseInt(rawPort, 10)
  listenTarget = isNaN(parsed) ? rawPort : parsed
}

const app = next({ dev })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        handle(req, res, parsedUrl)
      } catch (err) {
        console.error('Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })

    server.listen(listenTarget, (err) => {
      if (err) throw err
      console.log(`> Grand Addis Hotel ready on ${listenTarget} (mode: ${dev ? 'development' : 'production'})`)
    })
  })
  .catch((ex) => {
    console.error('Failed to start application:', ex)
    process.exit(1)
  })
