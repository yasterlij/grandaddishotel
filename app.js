// =============================================================================
// GRAND ADDIS HOTEL - Production Application Starter Script for Plesk
// =============================================================================
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
