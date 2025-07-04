// Main application logic
class IconStudio {
    constructor() {
        this.currentIcon = null;
        this.projectInfo = null;
        this.init();
    }

    async init() {
        await this.loadProjectInfo();
        this.bindEvents();
        await this.loadIconHistory();
    }

    async loadProjectInfo() {
        try {
            const response = await fetch('/api/project');
            this.projectInfo = await response.json();
            
            document.getElementById('project-info').textContent = 
                `Working in: ${this.projectInfo.metadata.projectName}`;
        } catch (error) {
            console.error('Failed to load project info:', error);
            this.showToast('Failed to load project information', 'error');
        }
    }

    bindEvents() {
        // AI form submission
        document.getElementById('ai-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateIcon();
        });

        // Export format buttons
        document.querySelectorAll('[data-format]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.exportIcon(e.target.dataset.format);
            });
        });

        // iOS export button
        document.getElementById('use-for-ios').addEventListener('click', () => {
            this.exportToIOS();
        });
    }

    async generateIcon() {
        const prompt = document.getElementById('prompt').value.trim();
        const style = document.getElementById('style').value;

        if (!prompt) {
            this.showToast('Please enter a description for your icon', 'error');
            return;
        }

        this.showLoading('Generating icon...');

        try {
            const response = await fetch('/api/icons/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt, style })
            });

            const result = await response.json();

            if (result.success) {
                this.displayIcon(result.path);
                this.showToast('Icon generated successfully!', 'success');
                await this.loadIconHistory();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Generation failed:', error);
            this.showToast('Failed to generate icon: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayIcon(iconPath) {
        const previewArea = document.getElementById('preview-area');
        const filename = iconPath.split('/').pop();
        
        previewArea.innerHTML = `
            <img src="/api/icons/${filename}" alt="Generated icon" class="preview-image">
        `;
        
        this.currentIcon = filename;
        document.getElementById('export-controls').style.display = 'block';
    }

    async loadIconHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            this.displayIconHistory(data.icons);
        } catch (error) {
            console.error('Failed to load icon history:', error);
        }
    }

    displayIconHistory(icons) {
        const historyContainer = document.getElementById('icon-history');
        
        if (icons.length === 0) {
            historyContainer.innerHTML = '<p>No icons yet. Generate or upload one to get started!</p>';
            return;
        }

        historyContainer.innerHTML = icons.map(icon => `
            <div class="history-item" onclick="app.selectHistoryIcon('${icon.name}')">
                <img src="/api/icons/${icon.name}" alt="Icon ${icon.name}">
            </div>
        `).join('');
    }

    selectHistoryIcon(filename) {
        this.displayIcon(`/api/icons/${filename}`);
        this.showToast('Icon selected from history', 'info');
    }

    async exportIcon(format) {
        if (!this.currentIcon) {
            this.showToast('No icon selected for export', 'error');
            return;
        }

        // For now, just download the current icon
        const link = document.createElement('a');
        link.href = `/api/icons/${this.currentIcon}`;
        link.download = `icon.${format}`;
        link.click();
        
        this.showToast(`Icon exported as ${format.toUpperCase()}`, 'success');
    }

    async exportToIOS() {
        if (!this.currentIcon) {
            this.showToast('No icon selected for iOS export', 'error');
            return;
        }

        this.showLoading('Generating iOS icon set...');

        try {
            const response = await fetch('/api/xcode/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ iconFile: this.currentIcon })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('iOS icon set generated and installed!', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('iOS export failed:', error);
            this.showToast('Failed to export to iOS: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    showLoading(text = 'Loading...') {
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new IconStudio();
});