// =============================================================================
// GRAND ADDIS HOTEL - Production Application Starter Script for Plesk
// =============================================================================
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)
const hostname = process.env.HOSTNAME || '0.0.0.0'

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Grand Addis Hotel ready on http://${hostname}:${port} (mode: ${dev ? 'development' : 'production'})`)
  })
}).catch((ex) => {
  console.error(ex.stack)
  process.exit(1)
})
