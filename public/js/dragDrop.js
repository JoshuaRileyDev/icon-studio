// Drag and drop functionality
class DragDropHandler {
    constructor() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Drop zone click to trigger file input
        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFiles(e.target.files);
            }
        });

        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                this.handleFiles(e.dataTransfer.files);
            }
        });

        // Prevent default drag behaviors on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    async handleFiles(files) {
        const file = files[0];
        
        // Validate file type
        if (!this.isValidImageType(file)) {
            app.showToast('Please select a valid image file (PNG, JPG, SVG, ICO)', 'error');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            app.showToast('File size must be less than 10MB', 'error');
            return;
        }

        app.showLoading('Uploading image...');

        try {
            const formData = new FormData();
            formData.append('icon', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Display the uploaded image
                app.displayIcon(result.path);
                app.showToast('Image uploaded successfully!', 'success');
                await app.loadIconHistory();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            app.showToast('Failed to upload image: ' + error.message, 'error');
        } finally {
            app.hideLoading();
            // Reset file input
            this.fileInput.value = '';
        }
    }

    isValidImageType(file) {
        const validTypes = [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/svg+xml',
            'image/x-icon',
            'image/vnd.microsoft.icon'
        ];
        return validTypes.includes(file.type);
    }

    updateDropZoneText(text) {
        const p = this.dropZone.querySelector('p');
        if (p) {
            p.textContent = text;
        }
    }
}

// Initialize drag and drop when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DragDropHandler();
});