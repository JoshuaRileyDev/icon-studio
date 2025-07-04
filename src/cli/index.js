#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const server = require('./server');
const { createIconStudioFolder } = require('../utils/fileSystem');

const program = new Command();

program
  .name('icon-studio')
  .description('CLI-based icon design and generation tool')
  .version('1.0.0')
  .argument('[directory]', 'Working directory for icon project', process.cwd())
  .option('-p, --port <port>', 'Port to run server on', '3000')
  .option('--no-open', 'Don\'t automatically open browser')
  .action(async (directory, options) => {
    try {
      // Resolve and validate directory
      const workingDir = path.resolve(directory);
      if (!fs.existsSync(workingDir)) {
        console.error(`Error: Directory ${workingDir} does not exist`);
        process.exit(1);
      }

      // Create .icon-studio folder if it doesn't exist
      await createIconStudioFolder(workingDir);

      // Start server
      const port = parseInt(options.port);
      const serverInstance = await server.start(port, workingDir);

      console.log(`<� Icon Studio started at http://localhost:${port}`);
      console.log(`=� Working directory: ${workingDir}`);
      console.log(`=� Icon history: ${path.join(workingDir, '.icon-studio')}`);

      // Open browser if not disabled
      if (options.open) {
        try {
          const open = await import('open');
          await open.default(`http://localhost:${port}`);
        } catch (error) {
          console.log('Could not auto-open browser. Please visit: http://localhost:' + port);
        }
      }

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n=� Shutting down Icon Studio...');
        serverInstance.close(() => {
          process.exit(0);
        });
      });

    } catch (error) {
      console.error('Error starting Icon Studio:', error.message);
      process.exit(1);
    }
  });

program.parse();