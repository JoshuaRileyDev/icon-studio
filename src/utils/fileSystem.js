const fs = require('fs-extra');
const path = require('path');

async function createIconStudioFolder(workingDir) {
  const iconStudioPath = path.join(workingDir, '.icon-studio');
  
  // Create main folder
  await fs.ensureDir(iconStudioPath);
  
  // Create subfolders
  await fs.ensureDir(path.join(iconStudioPath, 'history', 'generated'));
  await fs.ensureDir(path.join(iconStudioPath, 'history', 'uploaded'));
  await fs.ensureDir(path.join(iconStudioPath, 'exports', 'ios'));
  
  // Create config files if they don't exist
  const configPath = path.join(iconStudioPath, 'config.json');
  const metadataPath = path.join(iconStudioPath, 'metadata.json');
  
  if (!await fs.pathExists(configPath)) {
    await fs.writeJson(configPath, {
      version: '1.0.0',
      preferences: {
        defaultExportFormat: 'png',
        aiProvider: 'openai',
        autoDetectXcodeProjects: true
      }
    }, { spaces: 2 });
  }
  
  if (!await fs.pathExists(metadataPath)) {
    await fs.writeJson(metadataPath, {
      projectName: path.basename(workingDir),
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      iconCount: 0,
      exports: []
    }, { spaces: 2 });
  }
  
  return iconStudioPath;
}

async function saveIconToHistory(workingDir, iconData, type = 'generated') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `icon-${timestamp}.png`;
  const historyPath = path.join(workingDir, '.icon-studio', 'history', type);
  const filePath = path.join(historyPath, fileName);
  
  await fs.ensureDir(historyPath);
  await fs.writeFile(filePath, iconData);
  
  // Update metadata
  const metadataPath = path.join(workingDir, '.icon-studio', 'metadata.json');
  const metadata = await fs.readJson(metadataPath);
  metadata.iconCount++;
  metadata.lastModified = new Date().toISOString();
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  
  return filePath;
}

async function getIconHistory(workingDir, type = 'all') {
  const historyPath = path.join(workingDir, '.icon-studio', 'history');
  const icons = [];
  
  if (type === 'all' || type === 'generated') {
    const generatedPath = path.join(historyPath, 'generated');
    if (await fs.pathExists(generatedPath)) {
      const files = await fs.readdir(generatedPath);
      for (const file of files) {
        const filePath = path.join(generatedPath, file);
        const stats = await fs.stat(filePath);
        icons.push({
          name: file,
          path: filePath,
          type: 'generated',
          created: stats.birthtime,
          size: stats.size
        });
      }
    }
  }
  
  if (type === 'all' || type === 'uploaded') {
    const uploadedPath = path.join(historyPath, 'uploaded');
    if (await fs.pathExists(uploadedPath)) {
      const files = await fs.readdir(uploadedPath);
      for (const file of files) {
        const filePath = path.join(uploadedPath, file);
        const stats = await fs.stat(filePath);
        icons.push({
          name: file,
          path: filePath,
          type: 'uploaded',
          created: stats.birthtime,
          size: stats.size
        });
      }
    }
  }
  
  return icons.sort((a, b) => b.created - a.created);
}

module.exports = {
  createIconStudioFolder,
  saveIconToHistory,
  getIconHistory
};