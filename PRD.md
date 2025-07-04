# Icon Studio - Product Requirements Document

## Project Overview

Icon Studio is a CLI-based icon design and generation tool that launches a beautiful web interface for creating, editing, and managing icons. It provides AI-powered icon generation via ChatGPT integration and automatically formats icons for iOS Xcode projects.

## Core Features

### 1. CLI Interface
- **Command**: `icon-studio [working-directory]`
- **Functionality**: Launches local web server and opens browser to icon designer
- **Default Port**: 3000 (with fallback port detection)

### 2. Web-based Icon Designer
- **Beautiful UI**: Modern, responsive design with intuitive controls
- **Real-time Preview**: Live preview of icon designs
- **Export Options**: Multiple format support (PNG, SVG, ICO)
- **History Management**: Access to previously generated icons

### 3. AI-Powered Icon Generation
- **ChatGPT Integration**: Natural language prompts for icon generation
- **Prompt Examples**: Pre-built prompt templates
- **Style Controls**: Adjustable parameters (style, color, theme)
- **Multiple Variations**: Generate multiple options per prompt

### 4. Image Upload & Processing
- **Drag & Drop**: Easy image upload interface
- **Format Support**: PNG, JPG, SVG, ICO input formats
- **Image Enhancement**: Basic editing tools (resize, crop, adjust)
- **Vector Conversion**: Automatic vectorization options

### 5. iOS Xcode Integration
- **"Use This Icon" Button**: One-click iOS asset generation
- **Automatic Resizing**: Generates all required iOS icon sizes
- **Asset Replacement**: Automatically finds and replaces AppIcon.appiconset
- **Size Validation**: Ensures proper dimensions and formats

### 6. Project History & Management
- **`.icon-studio` Folder**: Hidden folder in working directory
- **Version Control**: Track icon iterations and changes
- **Metadata Storage**: Prompts, settings, and generation details
- **Export History**: Record of all generated icon sets

## Technical Architecture

### Backend (Node.js/Express)
```
icon-studio/
├── src/
│   ├── cli/
│   │   ├── index.js              # CLI entry point
│   │   └── server.js             # Express server setup
│   ├── routes/
│   │   ├── api.js                # API routes
│   │   ├── icons.js              # Icon generation endpoints
│   │   └── xcode.js              # iOS integration endpoints
│   ├── services/
│   │   ├── chatgpt.js            # ChatGPT API integration
│   │   ├── imageProcessor.js     # Image manipulation
│   │   ├── xcodeIntegration.js   # iOS asset management
│   │   └── historyManager.js     # Project history
│   └── utils/
│       ├── fileSystem.js         # File operations
│       └── validation.js         # Input validation
├── public/                       # Static web assets
├── package.json
└── README.md
```

### Frontend (Vanilla JS/HTML/CSS)
```
public/
├── index.html                    # Main interface
├── css/
│   ├── main.css                  # Core styles
│   └── components.css            # Component styles
├── js/
│   ├── app.js                    # Main application logic
│   ├── iconGenerator.js          # Icon generation UI
│   ├── dragDrop.js               # File upload handling
│   └── xcodeExport.js            # iOS export functionality
└── assets/
    ├── icons/                    # UI icons
    └── templates/                # Icon templates
```

## User Experience Flow

### 1. Initial Setup
1. User runs `icon-studio` in terminal
2. CLI checks for existing `.icon-studio` folder
3. Creates folder if not exists
4. Launches web server on localhost:3000
5. Opens browser to icon designer interface

### 2. Icon Generation Workflow
1. **Choose Method**: AI prompt or image upload
2. **Input**: Enter prompt or drag/drop image
3. **Generate**: Process request and display results
4. **Refine**: Adjust parameters and regenerate if needed
5. **Preview**: View icon in different contexts
6. **Export**: Choose format and save location

### 3. iOS Integration Workflow
1. **Select Icon**: Choose generated or uploaded icon
2. **Click "Use This Icon"**: Trigger iOS processing
3. **Auto-resize**: Generate all required iOS sizes
4. **Find Assets**: Scan working directory for .xcodeproj
5. **Replace Icons**: Update AppIcon.appiconset contents
6. **Confirmation**: Show success message with details

## Technical Specifications

### Dependencies
- **Backend**: Express.js, Sharp (image processing), OpenAI API
- **Frontend**: Vanilla JavaScript, CSS Grid/Flexbox
- **CLI**: Commander.js, Open (browser launching)
- **File System**: fs-extra, glob pattern matching

### iOS Icon Sizes Required
- **iPhone**: 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024
- **iPad**: 20x20, 29x29, 40x40, 58x58, 76x76, 80x80, 152x152, 167x167, 1024x1024
- **Apple Watch**: 24x24, 27.5x27.5, 29x29, 40x40, 44x44, 50x50, 86x86, 98x98, 108x108, 117x117, 129x129

### API Endpoints
- `POST /api/generate` - Generate icon from prompt
- `POST /api/upload` - Upload and process image
- `GET /api/history` - Retrieve project history
- `POST /api/export/ios` - Generate iOS asset bundle
- `GET /api/projects` - Scan for Xcode projects

### File Structure (.icon-studio)
```
.icon-studio/
├── history/
│   ├── generated/               # AI-generated icons
│   └── uploaded/                # User-uploaded icons
├── exports/
│   └── ios/                     # iOS asset exports
├── config.json                  # User preferences
└── metadata.json               # Project metadata
```

## Development Phases

### Phase 1: Core Infrastructure
- [x] CLI setup and server launching
- [x] Basic web interface
- [x] File system management
- [x] History folder creation

### Phase 2: Icon Generation
- [ ] ChatGPT API integration
- [ ] Image upload and processing
- [ ] Preview and editing tools
- [ ] Export functionality

### Phase 3: iOS Integration
- [ ] Xcode project detection
- [ ] Icon resizing pipeline
- [ ] Asset replacement logic
- [ ] Validation and error handling

### Phase 4: Polish & Features
- [ ] UI/UX improvements
- [ ] Advanced editing tools
- [ ] Additional export formats
- [ ] Performance optimization

## Success Metrics

- **Ease of Use**: Single command launches full functionality
- **Generation Quality**: AI-generated icons meet design standards
- **iOS Compatibility**: 100% success rate for Xcode integration
- **Performance**: Sub-5 second generation and processing times
- **Reliability**: Robust error handling and recovery

## Future Enhancements

- **Design System Integration**: Support for design tokens
- **Team Collaboration**: Shared icon libraries
- **Version Control**: Git integration for icon history
- **Plugin System**: Extensible architecture for custom tools
- **Advanced AI**: Fine-tuned models for specific icon styles