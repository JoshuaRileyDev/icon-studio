const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const apiRoutes = require('../routes/api');
const iconRoutes = require('../routes/icons');
const xcodeRoutes = require('../routes/xcode');

class IconStudioServer {
  constructor() {
    this.app = express();
    this.workingDir = '';
    this.server = null;
  }

  setupMiddleware() {
    // CORS
    this.app.use(cors());

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use(express.static(path.join(__dirname, '../../public')));

    // File upload handling
    const upload = multer({
      dest: 'uploads/',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PNG, JPG, SVG, and ICO files are allowed.'));
        }
      }
    });

    this.app.use('/api/upload', upload.single('icon'));
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', apiRoutes);
    this.app.use('/api/icons', iconRoutes);
    this.app.use('/api/xcode', xcodeRoutes);

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', workingDir: this.workingDir });
    });

    // SPA fallback
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../public/index.html'));
    });
  }

  setupGlobals(workingDir) {
    this.workingDir = workingDir;
    // Make working directory available to all routes
    this.app.use((req, res, next) => {
      req.workingDir = workingDir;
      next();
    });
  }

  async start(port, workingDir) {
    return new Promise((resolve, reject) => {
      this.setupGlobals(workingDir);
      this.setupMiddleware();
      this.setupRoutes();

      // Try to start server, with fallback ports
      const tryPort = (currentPort) => {
        this.server = this.app.listen(currentPort, (err) => {
          if (err) {
            if (err.code === 'EADDRINUSE' && currentPort < port + 10) {
              console.log(`Port ${currentPort} is busy, trying ${currentPort + 1}...`);
              tryPort(currentPort + 1);
            } else {
              reject(err);
            }
          } else {
            console.log(`Server started on port ${currentPort}`);
            resolve(this.server);
          }
        });
      };

      tryPort(port);
    });
  }
}

module.exports = new IconStudioServer();