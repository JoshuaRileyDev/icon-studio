const express = require('express');
const router = express.Router();
const xcodeIntegration = require('../services/xcodeIntegration');

// Export icon for iOS
router.post('/export', async (req, res) => {
  try {
    const { iconFile } = req.body;
    
    if (!iconFile) {
      return res.status(400).json({ error: 'Icon file is required' });
    }
    
    const result = await xcodeIntegration.generateIosIconSet(req.workingDir, iconFile);
    
    res.json({
      success: true,
      message: 'iOS icon set generated successfully',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scan for Xcode projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await xcodeIntegration.findXcodeProjects(req.workingDir);
    
    res.json({
      projects,
      count: projects.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;