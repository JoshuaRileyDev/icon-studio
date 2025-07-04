const express = require('express');
const router = express.Router();
const { getIconHistory } = require('../utils/fileSystem');

// Get project info
router.get('/project', async (req, res) => {
  try {
    const workingDir = req.workingDir;
    const fs = require('fs-extra');
    const path = require('path');
    
    const metadataPath = path.join(workingDir, '.icon-studio', 'metadata.json');
    const metadata = await fs.readJson(metadataPath);
    
    res.json({
      workingDir,
      metadata,
      status: 'active'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get icon history
router.get('/history', async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    const icons = await getIconHistory(req.workingDir, type);
    res.json({ icons });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file handler
router.post('/upload', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { saveIconToHistory } = require('../utils/fileSystem');
    const fs = require('fs-extra');
    
    // Read uploaded file
    const fileData = await fs.readFile(req.file.path);
    
    // Save to history
    const savedPath = await saveIconToHistory(req.workingDir, fileData, 'uploaded');
    
    // Clean up temp file
    await fs.remove(req.file.path);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      path: savedPath,
      filename: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;