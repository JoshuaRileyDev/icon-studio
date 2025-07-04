const fs = require('fs-extra');
const path = require('path');

class ValidationUtils {
    static validatePrompt(prompt) {
        const errors = [];
        
        if (!prompt || typeof prompt !== 'string') {
            errors.push('Prompt is required and must be a string');
        } else {
            const trimmed = prompt.trim();
            
            if (trimmed.length < 3) {
                errors.push('Prompt must be at least 3 characters long');
            }
            
            if (trimmed.length > 500) {
                errors.push('Prompt must be less than 500 characters');
            }
            
            // Check for potentially harmful content
            const blockedTerms = ['explicit', 'nsfw', 'adult', 'violence'];
            const lowerPrompt = trimmed.toLowerCase();
            
            for (const term of blockedTerms) {
                if (lowerPrompt.includes(term)) {
                    errors.push('Prompt contains inappropriate content');
                    break;
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    static validateStyle(style) {
        const validStyles = ['modern', 'flat', 'gradient', 'outline', 'filled', 'sketch', 'corporate'];
        
        if (!style || !validStyles.includes(style)) {
            return {
                valid: false,
                errors: [`Style must be one of: ${validStyles.join(', ')}`]
            };
        }
        
        return { valid: true, errors: [] };
    }

    static validateImageFile(file) {
        const errors = [];
        
        if (!file) {
            errors.push('File is required');
            return { valid: false, errors };
        }
        
        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push('File size must be less than 10MB');
        }
        
        // Check file type
        const allowedTypes = [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/svg+xml',
            'image/x-icon',
            'image/vnd.microsoft.icon'
        ];
        
        if (!allowedTypes.includes(file.mimetype)) {
            errors.push('File must be a valid image (PNG, JPG, SVG, ICO)');
        }
        
        // Check filename
        if (file.originalname) {
            const filename = file.originalname;
            const ext = path.extname(filename).toLowerCase();
            const validExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.ico'];
            
            if (!validExtensions.includes(ext)) {
                errors.push('File extension must be one of: .png, .jpg, .jpeg, .svg, .ico');
            }
            
            // Check for dangerous characters in filename
            const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
            if (dangerousChars.test(filename)) {
                errors.push('Filename contains invalid characters');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    static validateDirectory(dirPath) {
        const errors = [];
        
        if (!dirPath || typeof dirPath !== 'string') {
            errors.push('Directory path is required');
            return { valid: false, errors };
        }
        
        const resolvedPath = path.resolve(dirPath);
        
        try {
            if (!fs.existsSync(resolvedPath)) {
                errors.push('Directory does not exist');
            } else {
                const stats = fs.statSync(resolvedPath);
                if (!stats.isDirectory()) {
                    errors.push('Path is not a directory');
                }
                
                // Check if directory is readable/writable
                try {
                    fs.accessSync(resolvedPath, fs.constants.R_OK | fs.constants.W_OK);
                } catch (error) {
                    errors.push('Directory is not readable/writable');
                }
            }
        } catch (error) {
            errors.push('Invalid directory path');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            resolvedPath
        };
    }

    static validatePort(port) {
        const errors = [];
        
        const portNum = parseInt(port);
        
        if (isNaN(portNum)) {
            errors.push('Port must be a number');
        } else if (portNum < 1024 || portNum > 65535) {
            errors.push('Port must be between 1024 and 65535');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            port: portNum
        };
    }

    static validateIconSize(size) {
        const errors = [];
        
        if (!size || typeof size !== 'string') {
            errors.push('Size is required');
            return { valid: false, errors };
        }
        
        const validSizes = ['256x256', '512x512', '1024x1024'];
        
        if (!validSizes.includes(size)) {
            errors.push(`Size must be one of: ${validSizes.join(', ')}`);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    static sanitizeFilename(filename) {
        // Remove or replace dangerous characters
        return filename
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase();
    }

    static validateApiKey(apiKey) {
        const errors = [];
        
        if (!apiKey || typeof apiKey !== 'string') {
            errors.push('API key is required');
        } else {
            const trimmed = apiKey.trim();
            
            if (trimmed.length < 10) {
                errors.push('API key appears to be too short');
            }
            
            // Basic OpenAI API key format check
            if (!trimmed.startsWith('sk-')) {
                errors.push('API key does not appear to be a valid OpenAI key');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    static validateRequest(req, requiredFields = []) {
        const errors = [];
        
        for (const field of requiredFields) {
            if (!(field in req.body) || req.body[field] === null || req.body[field] === undefined) {
                errors.push(`Field '${field}' is required`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = ValidationUtils;