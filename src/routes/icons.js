const express = require('express');
const router = express.Router();
const chatgptService = require('../services/chatgpt');
const { saveIconToHistory } = require('../utils/fileSystem');

// Generate icon from prompt
router.post('/generate', async (req, res) => {
  try {
    const { prompt, style = 'modern', size = '1024x1024' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Generate icon using ChatGPT/DALL-E
    const iconData = await chatgptService.generateIcon(prompt, style, size);
    
    // Save to history
    const savedPath = await saveIconToHistory(req.workingDir, iconData, 'generated');
    
    res.json({
      success: true,
      message: 'Icon generated successfully',
      path: savedPath,
      prompt,
      style,
      size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get icon data
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const fs = require('fs-extra');
    const path = require('path');
    
    // Look for file in history folders
    const generatedPath = path.join(req.workingDir, '.icon-studio', 'history', 'generated', filename);
    const uploadedPath = path.join(req.workingDir, '.icon-studio', 'history', 'uploaded', filename);
    
    let filePath;
    if (await fs.pathExists(generatedPath)) {
      filePath = generatedPath;
    } else if (await fs.pathExists(uploadedPath)) {
      filePath = uploadedPath;
    } else {
      return res.status(404).json({ error: 'Icon not found' });
    }
    
    // Return file
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;