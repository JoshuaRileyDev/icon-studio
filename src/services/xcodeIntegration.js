const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

class XcodeIntegrationService {
  constructor() {
    // Complete iOS icon sizes with proper naming for Contents.json compatibility
    this.iosSizes = [
      // iPhone Notification
      { size: 20, scale: 2, filename: 'notification-icon@2x.png', idiom: 'iphone' },
      { size: 20, scale: 3, filename: 'notification-icon@3x.png', idiom: 'iphone' },
      
      // iPhone Settings
      { size: 29, scale: 2, filename: 'settings-icon@2x.png', idiom: 'iphone' },
      { size: 29, scale: 3, filename: 'settings-icon@3x.png', idiom: 'iphone' },
      
      // iPhone Spotlight
      { size: 40, scale: 2, filename: 'spotlight-icon@2x.png', idiom: 'iphone' },
      { size: 40, scale: 3, filename: 'spotlight-icon@3x.png', idiom: 'iphone' },
      
      // iPhone App
      { size: 60, scale: 2, filename: 'app-icon@2x.png', idiom: 'iphone' },
      { size: 60, scale: 3, filename: 'app-icon@3x.png', idiom: 'iphone' },
      
      // iPad Notification
      { size: 20, scale: 1, filename: 'ipad-notification-icon.png', idiom: 'ipad' },
      { size: 20, scale: 2, filename: 'ipad-notification-icon@2x.png', idiom: 'ipad' },
      
      // iPad Settings
      { size: 29, scale: 1, filename: 'ipad-settings-icon.png', idiom: 'ipad' },
      { size: 29, scale: 2, filename: 'ipad-settings-icon@2x.png', idiom: 'ipad' },
      
      // iPad Spotlight
      { size: 40, scale: 1, filename: 'ipad-spotlight-icon.png', idiom: 'ipad' },
      { size: 40, scale: 2, filename: 'ipad-spotlight-icon@2x.png', idiom: 'ipad' },
      
      // iPad App
      { size: 76, scale: 1, filename: 'ipad-app-icon.png', idiom: 'ipad' },
      { size: 76, scale: 2, filename: 'ipad-app-icon@2x.png', idiom: 'ipad' },
      
      // iPad Pro App
      { size: 83.5, scale: 2, filename: 'ipad-pro-app-icon@2x.png', idiom: 'ipad' },
      
      // App Store (Marketing)
      { size: 1024, scale: 1, filename: 'app-store-icon.png', idiom: 'ios-marketing' }
    ];
  }

  async generateIosIconSet(workingDir, iconFile) {
    try {
      // Find source icon
      const iconPath = this.findIconPath(workingDir, iconFile);
      if (!iconPath) {
        throw new Error('Source icon not found');
      }

      // Create export directory
      const exportDir = path.join(workingDir, '.icon-studio', 'exports', 'ios');
      await fs.ensureDir(exportDir);

      // Generate all required sizes
      const generatedIcons = [];
      console.log(`Generating ${this.iosSizes.length} icon sizes...`);
      
      for (const iconSpec of this.iosSizes) {
        const pixelSize = Math.round(iconSpec.size * iconSpec.scale);
        const outputPath = path.join(exportDir, iconSpec.filename);
        
        // Special handling for App Store icon (1024x1024) - highest quality
        const isAppStoreIcon = iconSpec.size === 1024;
        
        const sharpInstance = sharp(iconPath)
          .resize(pixelSize, pixelSize, {
            fit: 'cover',
            position: 'center',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          });
        
        if (isAppStoreIcon) {
          // Maximum quality for App Store icon
          await sharpInstance
            .png({ 
              quality: 100, 
              compressionLevel: 0,
              palette: false 
            })
            .toFile(outputPath);
        } else {
          // High quality for other icons
          await sharpInstance
            .png({ 
              quality: 95,
              compressionLevel: 6 
            })
            .toFile(outputPath);
        }
        
        generatedIcons.push({
          filename: iconSpec.filename,
          size: `${iconSpec.size}pt`,
          scale: `${iconSpec.scale}x`,
          pixels: `${pixelSize}x${pixelSize}`,
          path: outputPath,
          idiom: iconSpec.idiom,
          isAppStore: isAppStoreIcon
        });
      }
      
      console.log(`Generated ${generatedIcons.length} icon files`);

      // Try to find and update Xcode projects
      const xcodeProjects = await this.findXcodeProjects(workingDir);
      let updatedProjects = [];

      let totalRemovedFiles = 0;
      let totalAddedFiles = 0;
      const updateDetails = [];

      for (const project of xcodeProjects) {
        try {
          const result = await this.updateXcodeProject(project, exportDir);
          if (result && typeof result === 'object') {
            updatedProjects.push(project);
            totalRemovedFiles += result.removedFiles || 0;
            totalAddedFiles += result.addedFiles || 0;
            updateDetails.push({
              project: path.basename(project),
              ...result
            });
          }
        } catch (error) {
          console.warn(`Failed to update project ${project}:`, error.message);
          updateDetails.push({
            project: path.basename(project),
            error: error.message
          });
        }
      }

      const appStoreIcon = generatedIcons.find(icon => icon.isAppStore);

      return {
        generatedIcons,
        exportDir,
        xcodeProjects,
        updatedProjects,
        updateDetails,
        totalRemovedFiles,
        totalAddedFiles,
        appStoreIcon,
        message: `Generated ${generatedIcons.length} icon sizes including App Store 1024x1024. Replaced ${totalRemovedFiles} old icons with ${totalAddedFiles} new ones in ${updatedProjects.length} Xcode project(s).`
      };

    } catch (error) {
      throw new Error(`Failed to generate iOS icon set: ${error.message}`);
    }
  }

  findIconPath(workingDir, iconFile) {
    const possiblePaths = [
      path.join(workingDir, '.icon-studio', 'history', 'generated', iconFile),
      path.join(workingDir, '.icon-studio', 'history', 'uploaded', iconFile)
    ];

    for (const iconPath of possiblePaths) {
      if (fs.existsSync(iconPath)) {
        return iconPath;
      }
    }
    return null;
  }

  async findXcodeProjects(workingDir) {
    try {
      const pattern = path.join(workingDir, '**/*.xcodeproj');
      const projects = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/.git/**'] });
      return projects;
    } catch (error) {
      console.error('Error finding Xcode projects:', error);
      return [];
    }
  }

  async updateXcodeProject(projectPath, iconSourceDir) {
    try {
      // Look for AppIcon.appiconset
      const assetsPattern = path.join(path.dirname(projectPath), '**/*AppIcon.appiconset');
      const appiconSets = glob.sync(assetsPattern);

      if (appiconSets.length === 0) {
        throw new Error('No AppIcon.appiconset found in project');
      }

      // Update the first AppIcon.appiconset found
      const appiconSet = appiconSets[0];
      const replacementResult = await this.replaceAppIconSet(appiconSet, iconSourceDir);
      
      return {
        appiconSetPath: appiconSet,
        ...replacementResult
      };
    } catch (error) {
      throw new Error(`Failed to update Xcode project: ${error.message}`);
    }
  }

  async replaceAppIconSet(appiconSetPath, iconSourceDir) {
    console.log(`Replacing app icon set at: ${appiconSetPath}`);
    
    // First, remove ALL existing PNG files in the AppIcon.appiconset
    const existingFiles = await fs.readdir(appiconSetPath);
    const pngFiles = existingFiles.filter(file => file.endsWith('.png'));
    
    console.log(`Removing ${pngFiles.length} existing icon files...`);
    for (const file of pngFiles) {
      const filePath = path.join(appiconSetPath, file);
      await fs.remove(filePath);
    }

    // Copy all our generated icons to the AppIcon.appiconset directory
    const sourceFiles = await fs.readdir(iconSourceDir);
    const copiedFiles = [];
    
    for (const file of sourceFiles) {
      if (file.endsWith('.png')) {
        const sourcePath = path.join(iconSourceDir, file);
        const destPath = path.join(appiconSetPath, file);
        await fs.copy(sourcePath, destPath);
        copiedFiles.push(file);
      }
    }
    
    console.log(`Copied ${copiedFiles.length} new icon files`);

    // Create a comprehensive Contents.json with all our icons
    await this.createContentsJson(appiconSetPath);
    
    return { removedFiles: pngFiles.length, addedFiles: copiedFiles.length };
  }

  async createContentsJson(appiconSetPath) {
    const contentsPath = path.join(appiconSetPath, 'Contents.json');
    
    // Create a complete Contents.json with all icon sizes
    const contents = {
      images: this.iosSizes.map(iconSpec => ({
        filename: iconSpec.filename,
        idiom: iconSpec.idiom,
        scale: `${iconSpec.scale}x`,
        size: iconSpec.size === 83.5 ? "83.5x83.5" : `${iconSpec.size}x${iconSpec.size}`
      })),
      info: {
        author: "icon-studio",
        version: 1
      }
    };
    
    await fs.writeJson(contentsPath, contents, { spaces: 2 });
    console.log('Created new Contents.json with complete icon set');
    
    return contents;
  }
}

module.exports = new XcodeIntegrationService();