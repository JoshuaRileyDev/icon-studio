const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

class ImageProcessor {
    constructor() {
        this.supportedFormats = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'ico'];
    }

    async processImage(inputPath, options = {}) {
        const {
            width = null,
            height = null,
            format = 'png',
            quality = 90,
            background = { r: 0, g: 0, b: 0, alpha: 0 }
        } = options;

        try {
            let processor = sharp(inputPath);
            
            // Get image metadata
            const metadata = await processor.metadata();
            
            // Apply resizing if specified
            if (width || height) {
                processor = processor.resize(width, height, {
                    fit: 'fill',
                    background
                });
            }
            
            // Convert format if needed
            switch (format.toLowerCase()) {
                case 'png':
                    processor = processor.png({ quality });
                    break;
                case 'jpg':
                case 'jpeg':
                    processor = processor.jpeg({ quality });
                    break;
                case 'webp':
                    processor = processor.webp({ quality });
                    break;
            }
            
            return {
                processor,
                metadata,
                buffer: await processor.toBuffer()
            };
        } catch (error) {
            throw new Error(`Image processing failed: ${error.message}`);
        }
    }

    async generateThumbnail(inputPath, size = 128) {
        const result = await this.processImage(inputPath, {
            width: size,
            height: size,
            format: 'png'
        });
        
        return result.buffer;
    }

    async convertFormat(inputPath, outputFormat) {
        const result = await this.processImage(inputPath, {
            format: outputFormat
        });
        
        return result.buffer;
    }

    async createIconSizes(inputPath, sizes) {
        const results = [];
        
        for (const size of sizes) {
            const result = await this.processImage(inputPath, {
                width: size,
                height: size,
                format: 'png'
            });
            
            results.push({
                size,
                buffer: result.buffer,
                filename: `icon-${size}x${size}.png`
            });
        }
        
        return results;
    }

    async optimizeForWeb(inputPath) {
        const result = await this.processImage(inputPath, {
            format: 'webp',
            quality: 80
        });
        
        return result.buffer;
    }

    isValidImageFormat(filePath) {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        return this.supportedFormats.includes(ext);
    }

    async getImageInfo(inputPath) {
        try {
            const metadata = await sharp(inputPath).metadata();
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size,
                channels: metadata.channels,
                hasAlpha: metadata.hasAlpha
            };
        } catch (error) {
            throw new Error(`Failed to get image info: ${error.message}`);
        }
    }
}

module.exports = new ImageProcessor();