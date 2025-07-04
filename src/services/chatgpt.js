const OpenAI = require('openai');
require('dotenv').config();

class ChatGPTService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateIcon(prompt, style = 'modern', size = '1024x1024') {
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
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      return Buffer.from(imageBuffer);
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
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      
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
}

module.exports = new ChatGPTService();