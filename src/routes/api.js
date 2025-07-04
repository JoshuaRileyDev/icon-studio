const express = require('express');
const router = express.Router();
const { getIconHistory } = require('../utils/fileSystem');
const chatgptService = require('../services/chatgpt');

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
      status: 'active',
      aiStatus: chatgptService.getStatus()
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

// Get AI configuration status
router.get('/ai/status', async (req, res) => {
  try {
    const status = chatgptService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set OpenAI API key
router.post('/ai/configure', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    // Basic validation
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      return res.status(400).json({ error: 'Invalid API key format' });
    }
    
    // Set the API key
    chatgptService.setApiKey(apiKey);
    
    // Test the connection
    try {
      await chatgptService.testConnection();
      res.json({ 
        success: true, 
        message: 'API key configured successfully',
        status: chatgptService.getStatus()
      });
    } catch (testError) {
      res.status(400).json({ 
        error: 'API key test failed: ' + testError.message 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove OpenAI API key
router.delete('/ai/configure', async (req, res) => {
  try {
    chatgptService.setApiKey(null);
    res.json({ 
      success: true, 
      message: 'API key removed',
      status: chatgptService.getStatus()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;