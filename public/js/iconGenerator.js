// Icon generation utilities and helpers
class IconGenerator {
    constructor() {
        this.promptExamples = [
            'A modern camera icon with clean lines',
            'Minimalist mail envelope icon in blue',
            'Geometric heart icon with gradient',
            'Simple house icon with rounded corners',
            'Shopping cart icon in flat design',
            'User profile icon with circle background',
            'Settings gear icon with metallic effect',
            'Play button icon with shadow',
            'Search magnifying glass icon',
            'Calendar icon showing current date'
        ];
        this.init();
    }

    init() {
        this.addPromptSuggestions();
        this.bindPromptHelpers();
    }

    addPromptSuggestions() {
        const promptInput = document.getElementById('prompt');
        
        // Add placeholder cycling
        let currentExample = 0;
        const cyclePlaceholder = () => {
            promptInput.placeholder = this.promptExamples[currentExample];
            currentExample = (currentExample + 1) % this.promptExamples.length;
        };
        
        // Initial placeholder
        cyclePlaceholder();
        
        // Cycle placeholder every 3 seconds
        setInterval(cyclePlaceholder, 3000);
    }

    bindPromptHelpers() {
        const promptInput = document.getElementById('prompt');
        const styleSelect = document.getElementById('style');
        
        // Auto-suggest style based on prompt keywords
        promptInput.addEventListener('input', (e) => {
            this.suggestStyle(e.target.value);
        });

        // Add prompt enhancement buttons
        this.addPromptButtons();
    }

    suggestStyle(prompt) {
        const styleSelect = document.getElementById('style');
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('flat') || lowerPrompt.includes('simple')) {
            styleSelect.value = 'flat';
        } else if (lowerPrompt.includes('gradient') || lowerPrompt.includes('depth')) {
            styleSelect.value = 'gradient';
        } else if (lowerPrompt.includes('outline') || lowerPrompt.includes('line')) {
            styleSelect.value = 'outline';
        } else if (lowerPrompt.includes('sketch') || lowerPrompt.includes('hand')) {
            styleSelect.value = 'sketch';
        } else if (lowerPrompt.includes('corporate') || lowerPrompt.includes('business')) {
            styleSelect.value = 'corporate';
        }
    }

    addPromptButtons() {
        const aiForm = document.getElementById('ai-form');
        const promptInput = document.getElementById('prompt');
        
        // Create quick action buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'prompt-buttons';
        buttonContainer.style.cssText = `
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
            flex-wrap: wrap;
        `;
        
        const quickPrompts = [
            'Camera',
            'Mail',
            'Settings',
            'Home',
            'User',
            'Search'
        ];
        
        quickPrompts.forEach(prompt => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = prompt;
            button.className = 'btn btn-secondary';
            button.style.cssText = `
                padding: 0.25rem 0.75rem;
                font-size: 0.75rem;
                min-width: auto;
            `;
            
            button.addEventListener('click', () => {
                promptInput.value = `A modern ${prompt.toLowerCase()} icon with clean lines`;
                promptInput.focus();
            });
            
            buttonContainer.appendChild(button);
        });
        
        // Insert after prompt textarea
        promptInput.parentNode.appendChild(buttonContainer);
    }

    validatePrompt(prompt) {
        if (!prompt || prompt.trim().length < 3) {
            return 'Prompt must be at least 3 characters long';
        }
        
        if (prompt.length > 500) {
            return 'Prompt must be less than 500 characters';
        }
        
        return null;
    }

    enhancePrompt(prompt, style) {
        // Add style-specific enhancements
        const styleEnhancements = {
            modern: 'clean, minimalist, contemporary',
            flat: 'flat design, simple shapes, no shadows',
            gradient: 'gradient colors, depth, modern styling',
            outline: 'outline style, line art, minimal',
            filled: 'filled shapes, solid colors, bold',
            sketch: 'hand-drawn, sketch style, artistic',
            corporate: 'professional, business-like, clean'
        };
        
        const enhancement = styleEnhancements[style] || styleEnhancements.modern;
        
        return `${prompt}. Style: ${enhancement}. High quality icon design, professional appearance, suitable for app icons.`;
    }

    getRandomPrompt() {
        return this.promptExamples[Math.floor(Math.random() * this.promptExamples.length)];
    }
}

// Initialize icon generator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IconGenerator();
});