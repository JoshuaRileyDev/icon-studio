const OpenAI = require('openai');
require('dotenv').config();

class ChatGPTService {
  constructor() {
    this.openai = null;
    this.apiKey = null;
    this.initialize();
  }

  initialize(apiKey = null) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (key) {
      this.apiKey = key;
      this.openai = new OpenAI({ apiKey: key });
    }
  }

  isConfigured() {
    return this.openai !== null && this.apiKey !== null;
  }

  async generateIcon(prompt, style = 'modern', size = '1024x1024') {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured. Please add your API key to use AI generation features.');
    }

    try {
      // Enhance prompt for better icon generation
      const enhancedPrompt = this.enhancePrompt(prompt, style);
      
      // Generate image using DALL-E
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: "hd",
        style: "natural"
      });
      
      const imageUrl = response.data[0].url;
      
      // Download the image
      const https = require('https');
      const http = require('http');
      
      const imageBuffer = await new Promise((resolve, reject) => {
        const client = imageUrl.startsWith('https:') ? https : http;
        client.get(imageUrl, (response) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        }).on('error', reject);
      });
      
      return imageBuffer;
    } catch (error) {
      console.error('Error generating icon:', error);
      throw new Error(`Failed to generate icon: ${error.message}`);
    }
  }

  enhancePrompt(originalPrompt, style) {
    const styleModifiers = {
      modern: "clean, minimalist, modern design",
      flat: "flat design, simple shapes, no gradients",
      gradient: "gradient colors, depth, modern",
      outline: "outline style, line art, minimal",
      filled: "filled shapes, solid colors",
      sketch: "hand-drawn, sketch style",
      corporate: "professional, business-like, clean"
    };

    const iconSpecificInstructions = [
      "Create an icon that is:",
      "- Square format, centered",
      "- Clear and recognizable at small sizes",
      "- Suitable for app icons",
      "- Professional appearance",
      "- High contrast",
      "- No text or letters unless specifically requested"
    ].join(" ");

    return `${iconSpecificInstructions}. ${originalPrompt}. Style: ${styleModifiers[style] || styleModifiers.modern}.`;
  }

  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Test with a simple completion
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      throw new Error(`OpenAI connection failed: ${error.message}`);
    }
  }

  setApiKey(apiKey) {
    this.initialize(apiKey);
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      hasKey: !!this.apiKey
    };
  }
}

module.exports = new ChatGPTService();