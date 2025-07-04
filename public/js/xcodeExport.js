// Xcode export functionality
class XcodeExporter {
    constructor() {
        this.exportButton = document.getElementById('use-for-ios');
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkXcodeProjects();
    }

    bindEvents() {
        this.exportButton.addEventListener('click', () => {
            this.exportToXcode();
        });

        // Add project scan button
        this.addProjectScanButton();
    }

    async checkXcodeProjects() {
        try {
            const response = await fetch('/api/xcode/projects');
            const data = await response.json();
            
            this.updateExportUI(data.projects);
        } catch (error) {
            console.error('Failed to scan for Xcode projects:', error);
        }
    }

    updateExportUI(projects) {
        const iosExportSection = document.querySelector('.ios-export');
        const existingInfo = iosExportSection.querySelector('.project-info');
        
        if (existingInfo) {
            existingInfo.remove();
        }
        
        const projectInfo = document.createElement('div');
        projectInfo.className = 'project-info';
        projectInfo.style.cssText = `
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            font-size: 0.875rem;
        `;
        
        if (projects.length === 0) {
            projectInfo.innerHTML = `
                <div style="color: #b45309;">
                    <strong>  No Xcode projects found</strong><br>
                    Make sure you're running Icon Studio from a directory containing an Xcode project.
                </div>
            `;
            this.exportButton.disabled = true;
            this.exportButton.textContent = 'No Xcode Projects Found';
        } else {
            projectInfo.innerHTML = `
                <div style="color: #047857;">
                    <strong> ${projects.length} Xcode project${projects.length === 1 ? '' : 's'} found</strong><br>
                    ${projects.map(p => `" ${this.getProjectName(p)}`).join('<br>')}
                </div>
            `;
            this.exportButton.disabled = false;
            this.exportButton.textContent = 'Use This Icon for iOS';
        }
        
        iosExportSection.insertBefore(projectInfo, this.exportButton);
    }

    addProjectScanButton() {
        const iosExportSection = document.querySelector('.ios-export');
        
        const scanButton = document.createElement('button');
        scanButton.type = 'button';
        scanButton.className = 'btn btn-secondary';
        scanButton.textContent = '= Scan for Xcode Projects';
        scanButton.style.cssText = `
            margin-left: 0.5rem;
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
        `;
        
        scanButton.addEventListener('click', () => {
            this.checkXcodeProjects();
            app.showToast('Scanning for Xcode projects...', 'info');
        });
        
        // Add scan button next to main export button
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';
        
        iosExportSection.appendChild(buttonContainer);
        buttonContainer.appendChild(this.exportButton);
        buttonContainer.appendChild(scanButton);
    }

    async exportToXcode() {
        if (!app.currentIcon) {
            app.showToast('No icon selected for export', 'error');
            return;
        }

        app.showLoading('Generating iOS icon set and updating Xcode projects...');

        try {
            const response = await fetch('/api/xcode/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    iconFile: app.currentIcon 
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showExportSuccess(result);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Xcode export failed:', error);
            app.showToast('Failed to export to Xcode: ' + error.message, 'error');
        } finally {
            app.hideLoading();
        }
    }

    showExportSuccess(result) {
        const message = `
            <‰ iOS Export Complete!
            
            Generated: ${result.generatedIcons.length} icon sizes
            Updated: ${result.updatedProjects.length} Xcode project(s)
            Location: ${this.shortenPath(result.exportDir)}
        `;
        
        app.showToast(message, 'success');
        
        // Show detailed results in a modal-like overlay
        this.showDetailedResults(result);
    }

    showDetailedResults(result) {
        // Remove existing results if any
        const existingResults = document.getElementById('export-results');
        if (existingResults) {
            existingResults.remove();
        }
        
        const resultsOverlay = document.createElement('div');
        resultsOverlay.id = 'export-results';
        resultsOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
        `;
        
        const resultsContent = document.createElement('div');
        resultsContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        `;
        
        resultsContent.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: #059669;"><‰ iOS Export Results</h3>
            
            <div style="margin-bottom: 1.5rem;">
                <h4>Generated Icon Sizes (${result.generatedIcons.length})</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;">
                    ${result.generatedIcons.map(icon => `
                        <div style="text-align: center; padding: 0.5rem; background: #f8fafc; border-radius: 6px; font-size: 0.75rem;">
                            <div style="font-weight: 500;">${icon.pixels}</div>
                            <div style="color: #64748b;">${icon.size} @ ${icon.scale}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <h4>Updated Xcode Projects (${result.updatedProjects.length})</h4>
                ${result.updatedProjects.length > 0 ? `
                    <ul style="margin-top: 0.5rem; padding-left: 1rem;">
                        ${result.updatedProjects.map(project => `
                            <li style="margin-bottom: 0.25rem;">${this.getProjectName(project)}</li>
                        `).join('')}
                    </ul>
                ` : '<p style="color: #64748b; font-style: italic;">No projects were automatically updated</p>'}
            </div>
            
            <div style="text-align: center;">
                <button id="close-results" class="btn btn-primary">Close</button>
            </div>
        `;
        
        resultsOverlay.appendChild(resultsContent);
        document.body.appendChild(resultsOverlay);
        
        // Close button functionality
        document.getElementById('close-results').addEventListener('click', () => {
            resultsOverlay.remove();
        });
        
        // Close on overlay click
        resultsOverlay.addEventListener('click', (e) => {
            if (e.target === resultsOverlay) {
                resultsOverlay.remove();
            }
        });
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (document.getElementById('export-results')) {
                resultsOverlay.remove();
            }
        }, 10000);
    }

    getProjectName(projectPath) {
        return projectPath.split('/').pop().replace('.xcodeproj', '');
    }

    shortenPath(fullPath) {
        const parts = fullPath.split('/');
        if (parts.length > 3) {
            return '.../' + parts.slice(-3).join('/');
        }
        return fullPath;
    }
}

// Initialize Xcode exporter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new XcodeExporter();
});