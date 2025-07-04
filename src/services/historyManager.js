const fs = require('fs-extra');
const path = require('path');

class HistoryManager {
    constructor() {
        this.maxHistoryItems = 100; // Maximum number of icons to keep in history
    }

    async addToHistory(workingDir, iconData, metadata = {}) {
        try {
            const historyDir = path.join(workingDir, '.icon-studio', 'history');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `icon-${timestamp}.png`;
            
            // Determine the correct subdirectory
            const type = metadata.type || 'generated';
            const targetDir = path.join(historyDir, type);
            
            await fs.ensureDir(targetDir);
            
            // Save the icon file
            const filePath = path.join(targetDir, filename);
            await fs.writeFile(filePath, iconData);
            
            // Save metadata
            const metadataPath = path.join(targetDir, `${filename}.meta.json`);
            const fullMetadata = {
                filename,
                created: new Date().toISOString(),
                type,
                size: iconData.length,
                ...metadata
            };
            await fs.writeJson(metadataPath, fullMetadata, { spaces: 2 });
            
            // Clean up old items if necessary
            await this.cleanupHistory(workingDir);
            
            // Update project metadata
            await this.updateProjectMetadata(workingDir);
            
            return {
                filename,
                path: filePath,
                metadata: fullMetadata
            };
        } catch (error) {
            throw new Error(`Failed to add to history: ${error.message}`);
        }
    }

    async getHistory(workingDir, options = {}) {
        const {
            type = 'all', // 'all', 'generated', 'uploaded'
            limit = 50,
            sortBy = 'created', // 'created', 'name', 'size'
            sortOrder = 'desc' // 'asc', 'desc'
        } = options;

        try {
            const historyDir = path.join(workingDir, '.icon-studio', 'history');
            const items = [];

            const typesToCheck = type === 'all' ? ['generated', 'uploaded'] : [type];

            for (const itemType of typesToCheck) {
                const typeDir = path.join(historyDir, itemType);
                
                if (await fs.pathExists(typeDir)) {
                    const files = await fs.readdir(typeDir);
                    
                    for (const file of files) {
                        if (file.endsWith('.png')) {
                            const filePath = path.join(typeDir, file);
                            const metadataPath = path.join(typeDir, `${file}.meta.json`);
                            
                            let metadata = { type: itemType };
                            if (await fs.pathExists(metadataPath)) {
                                metadata = await fs.readJson(metadataPath);
                            } else {
                                // Fallback to file stats
                                const stats = await fs.stat(filePath);
                                metadata = {
                                    filename: file,
                                    created: stats.birthtime.toISOString(),
                                    type: itemType,
                                    size: stats.size
                                };
                            }
                            
                            items.push({
                                ...metadata,
                                path: filePath,
                                relativePath: path.relative(workingDir, filePath)
                            });
                        }
                    }
                }
            }

            // Sort items
            items.sort((a, b) => {
                let valueA = a[sortBy];
                let valueB = b[sortBy];
                
                if (sortBy === 'created') {
                    valueA = new Date(valueA);
                    valueB = new Date(valueB);
                }
                
                if (sortOrder === 'desc') {
                    return valueB > valueA ? 1 : -1;
                } else {
                    return valueA > valueB ? 1 : -1;
                }
            });

            // Apply limit
            return items.slice(0, limit);
        } catch (error) {
            throw new Error(`Failed to get history: ${error.message}`);
        }
    }

    async removeFromHistory(workingDir, filename, type = null) {
        try {
            const historyDir = path.join(workingDir, '.icon-studio', 'history');
            
            const typesToCheck = type ? [type] : ['generated', 'uploaded'];
            
            for (const itemType of typesToCheck) {
                const filePath = path.join(historyDir, itemType, filename);
                const metadataPath = path.join(historyDir, itemType, `${filename}.meta.json`);
                
                if (await fs.pathExists(filePath)) {
                    await fs.remove(filePath);
                    
                    if (await fs.pathExists(metadataPath)) {
                        await fs.remove(metadataPath);
                    }
                    
                    await this.updateProjectMetadata(workingDir);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            throw new Error(`Failed to remove from history: ${error.message}`);
        }
    }

    async cleanupHistory(workingDir) {
        try {
            const history = await this.getHistory(workingDir, { 
                limit: this.maxHistoryItems + 50,
                sortBy: 'created',
                sortOrder: 'desc'
            });

            if (history.length > this.maxHistoryItems) {
                const itemsToRemove = history.slice(this.maxHistoryItems);
                
                for (const item of itemsToRemove) {
                    await this.removeFromHistory(workingDir, item.filename, item.type);
                }
            }
        } catch (error) {
            console.error('Failed to cleanup history:', error);
        }
    }

    async updateProjectMetadata(workingDir) {
        try {
            const metadataPath = path.join(workingDir, '.icon-studio', 'metadata.json');
            const metadata = await fs.readJson(metadataPath);
            
            const history = await this.getHistory(workingDir);
            
            metadata.iconCount = history.length;
            metadata.lastModified = new Date().toISOString();
            
            await fs.writeJson(metadataPath, metadata, { spaces: 2 });
        } catch (error) {
            console.error('Failed to update project metadata:', error);
        }
    }

    async exportHistory(workingDir, exportPath) {
        try {
            const history = await this.getHistory(workingDir);
            const exportData = {
                exported: new Date().toISOString(),
                project: path.basename(workingDir),
                iconCount: history.length,
                items: history
            };
            
            await fs.writeJson(exportPath, exportData, { spaces: 2 });
            return exportData;
        } catch (error) {
            throw new Error(`Failed to export history: ${error.message}`);
        }
    }

    async getStatistics(workingDir) {
        try {
            const history = await this.getHistory(workingDir);
            
            const stats = {
                total: history.length,
                generated: history.filter(item => item.type === 'generated').length,
                uploaded: history.filter(item => item.type === 'uploaded').length,
                totalSize: history.reduce((sum, item) => sum + (item.size || 0), 0),
                oldestItem: history.length > 0 ? history[history.length - 1].created : null,
                newestItem: history.length > 0 ? history[0].created : null
            };
            
            return stats;
        } catch (error) {
            throw new Error(`Failed to get statistics: ${error.message}`);
        }
    }
}

module.exports = new HistoryManager();