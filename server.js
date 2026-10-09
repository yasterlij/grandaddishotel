/**
 * GRAND ADDIS HOTEL - Production Application Starter Script
 * Designed for Plesk Obsidian / Onyx (Phusion Passenger & Standalone Node.js)
 *
 * In Plesk Node.js Settings:
 *   - Application Startup File: server.js
 *   - Application Root: /httpdocs (or current repo directory)
 *   - Application Mode: production
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Unhandled request error:', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    server.listen(port, () => {
      console.log(`> Grand Addis Hotel running in ${dev ? 'development' : 'production'} mode`);
      console.log(`> Listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize Grand Addis Hotel server:', err);
    process.exit(1);
  });
