# Icon Studio

A CLI-based icon design and generation tool with AI-powered creation and iOS Xcode integration.

## Features

- 🎨 **Beautiful Web Interface**: Modern, responsive design for icon creation
- 🤖 **AI-Powered Generation**: Create icons using natural language prompts via ChatGPT/DALL-E
- 📁 **Drag & Drop Upload**: Easy image upload and processing
- 📱 **iOS Xcode Integration**: Automatic icon resizing and asset replacement
- 📚 **Project History**: Track and manage all generated icons
- 🎯 **Multiple Export Formats**: PNG, SVG, ICO support

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Add your OpenAI API key to .env
   ```

3. **Run Icon Studio**:
   ```bash
   npm start [working-directory]
   ```

4. **Open your browser**: The app will automatically open at `http://localhost:3000`

## Usage

### CLI Commands

```bash
# Start in current directory
icon-studio

# Start in specific directory
icon-studio /path/to/your/project

# Use custom port
icon-studio --port 8080

# Don't auto-open browser
icon-studio --no-open
```

### AI Icon Generation

1. Enter a description of your desired icon
2. Choose a style (modern, flat, gradient, etc.)
3. Click "Generate Icon"
4. Preview and export your icon

### iOS Integration

1. Generate or upload an icon
2. Click "Use This Icon for iOS"
3. Icon Studio will automatically:
   - Generate all required iOS icon sizes
   - Find your Xcode project(s)
   - Replace the AppIcon.appiconset contents

## Project Structure

```
icon-studio/
├── src/
│   ├── cli/           # CLI entry point and server
│   ├── routes/        # API endpoints
│   ├── services/      # Core business logic
│   └── utils/         # Utility functions
├── public/            # Web interface assets
└── .icon-studio/      # Project history and exports
```

## API Endpoints

- `POST /api/icons/generate` - Generate icon from prompt
- `POST /api/upload` - Upload image file
- `GET /api/history` - Get icon history
- `POST /api/xcode/export` - Export for iOS
- `GET /api/project` - Get project information

## Requirements

- Node.js 16+
- OpenAI API key
- Sharp (for image processing)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details