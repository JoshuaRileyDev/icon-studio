const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

class XcodeIntegrationService {
  constructor() {
    // iOS icon sizes and their file names
    this.iosSizes = [
      { size: 20, scale: 1, filename: 'icon_20pt.png' },
      { size: 20, scale: 2, filename: 'icon_20pt@2x.png' },
      { size: 20, scale: 3, filename: 'icon_20pt@3x.png' },
      { size: 29, scale: 1, filename: 'icon_29pt.png' },
      { size: 29, scale: 2, filename: 'icon_29pt@2x.png' },
      { size: 29, scale: 3, filename: 'icon_29pt@3x.png' },
      { size: 40, scale: 1, filename: 'icon_40pt.png' },
      { size: 40, scale: 2, filename: 'icon_40pt@2x.png' },
      { size: 40, scale: 3, filename: 'icon_40pt@3x.png' },
      { size: 60, scale: 2, filename: 'icon_60pt@2x.png' },
      { size: 60, scale: 3, filename: 'icon_60pt@3x.png' },
      { size: 76, scale: 1, filename: 'icon_76pt.png' },
      { size: 76, scale: 2, filename: 'icon_76pt@2x.png' },
      { size: 83.5, scale: 2, filename: 'icon_83.5@2x.png' },
      { size: 1024, scale: 1, filename: 'icon_1024pt.png' }
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
      for (const iconSpec of this.iosSizes) {
        const pixelSize = Math.round(iconSpec.size * iconSpec.scale);
        const outputPath = path.join(exportDir, iconSpec.filename);
        
        await sharp(iconPath)
          .resize(pixelSize, pixelSize, {
            fit: 'fill',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(outputPath);
        
        generatedIcons.push({
          filename: iconSpec.filename,
          size: `${iconSpec.size}pt`,
          scale: `${iconSpec.scale}x`,
          pixels: `${pixelSize}x${pixelSize}`,
          path: outputPath
        });
      }

      // Try to find and update Xcode projects
      const xcodeProjects = await this.findXcodeProjects(workingDir);
      let updatedProjects = [];

      for (const project of xcodeProjects) {
        try {
          const updated = await this.updateXcodeProject(project, exportDir);
          if (updated) {
            updatedProjects.push(project);
          }
        } catch (error) {
          console.warn(`Failed to update project ${project}:`, error.message);
        }
      }

      return {
        generatedIcons,
        exportDir,
        xcodeProjects,
        updatedProjects,
        message: `Generated ${generatedIcons.length} icon sizes. ${updatedProjects.length} Xcode projects updated.`
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
      await this.replaceAppIconSet(appiconSet, iconSourceDir);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to update Xcode project: ${error.message}`);
    }
  }

  async replaceAppIconSet(appiconSetPath, iconSourceDir) {
    // Copy all generated icons to the AppIcon.appiconset directory
    const sourceFiles = await fs.readdir(iconSourceDir);
    
    for (const file of sourceFiles) {
      if (file.endsWith('.png')) {
        const sourcePath = path.join(iconSourceDir, file);
        const destPath = path.join(appiconSetPath, file);
        await fs.copy(sourcePath, destPath);
      }
    }

    // Update Contents.json if it exists
    const contentsPath = path.join(appiconSetPath, 'Contents.json');
    if (await fs.pathExists(contentsPath)) {
      const contents = await fs.readJson(contentsPath);
      
      // Update the images array with our generated icons
      if (contents.images) {
        contents.images = contents.images.map(image => {
          const size = parseFloat(image.size?.split('x')[0] || 0);
          const scale = parseFloat(image.scale?.replace('x', '') || 1);
          
          const matchingIcon = this.iosSizes.find(icon => 
            icon.size === size && icon.scale === scale
          );
          
          if (matchingIcon) {
            return {
              ...image,
              filename: matchingIcon.filename
            };
          }
          
          return image;
        });
      }
      
      await fs.writeJson(contentsPath, contents, { spaces: 2 });
    }
  }
}

module.exports = new XcodeIntegrationService();