# 3D Architecture Simulator on Nostr

A web-based 3D architectural design tool that allows users to create, share, and explore architectural projects on the Nostr network.

## Features

### 🏗️ 3D Design Tools
- **Interactive 3D Scene**: Real-time 3D rendering with Three.js and React Three Fiber
- **Building Elements**: Walls, floors, roofs, windows, doors, columns, beams, and stairs
- **Material System**: Multiple materials including concrete, brick, wood, glass, steel, and stone
- **Color Customization**: Full color picker with preset colors
- **Transform Controls**: Position, rotation, and scale adjustments with real-time feedback

### 🎨 User Interface
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Automatic theme switching based on system preferences
- **Panel Management**: Collapsible left and right panels for optimal workspace
- **Fullscreen Mode**: Distraction-free design environment

### 📐 Design Features
- **Multiple View Modes**: Perspective, top, front, and side views
- **Grid System**: Infinite grid with customizable spacing
- **Real-time Shadows**: Dynamic lighting and shadow casting
- **Element Selection**: Click to select and edit individual elements
- **Property Panel**: Detailed controls for position, scale, rotation, and appearance

### 🌐 Nostr Integration
- **Project Sharing**: Publish architectural projects to the Nostr network
- **Project Gallery**: Browse and discover projects shared by the community
- **User Authentication**: Login with Nostr extensions (NIP-07)
- **Decentralized Storage**: Projects stored on Nostr relays (NIP-23)
- **Author Attribution**: View project creators and their profiles

### 💾 Project Management
- **Save/Load**: Export projects as JSON files
- **Project Metadata**: Name, description, tags, and architectural style
- **Element Statistics**: Track number and types of elements
- **Version Control**: Timestamps for creation and updates

## Getting Started

### Prerequisites
- Node.js 18+ 
- A Nostr extension like [Alby](https://getalby.com/) or [nos2x](https://github.com/fiatjaf/nos2x) (optional, for sharing projects)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open http://localhost:5173 in your browser

### Building for Production
```bash
npm run build
```

## Usage

### Creating Your First Project
1. **Start Building**: Use the toolbar on the left to select building tools
2. **Add Elements**: Click on tools like Wall, Floor, or Window to add them to your scene
3. **Edit Properties**: Select elements and use the properties panel on the right to adjust position, size, color, and material
4. **Change Views**: Use the view controls to see your design from different angles
5. **Save Your Work**: Use the Project Manager to save your design locally or share it on Nostr

### Sharing on Nostr
1. **Login**: Click the login button and connect your Nostr extension
2. **Share Project**: In the Project Manager, click "Share on Nostr"
3. **Add Details**: Fill in project name, description, and tags
4. **Publish**: Your project will be published to the Nostr network

### Browsing the Gallery
1. **Visit Gallery**: Click the "Gallery" button in the header
2. **Browse Projects**: Explore architectural projects shared by the community
3. **Filter & Search**: Use search and style filters to find specific types of projects
4. **Load Projects**: Click "Load" on any project to open it in the simulator

## Architecture

### Technology Stack
- **React 18**: Modern React with hooks and concurrent features
- **Three.js**: 3D graphics library for WebGL rendering
- **React Three Fiber**: React renderer for Three.js
- **React Three Drei**: Useful helpers and abstractions for R3F
- **Nostrify**: Nostr protocol implementation for React
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible UI components
- **Vite**: Fast build tool and development server

### Project Structure
```
src/
├── components/
│   ├── 3d/                    # 3D scene components
│   │   ├── Scene3D.tsx        # Main 3D canvas
│   │   ├── BuildingElementMesh.tsx  # Individual 3D elements
│   │   └── SceneLoader.tsx    # Loading component
│   ├── architecture/          # Architecture-specific components
│   │   ├── ArchitectureSimulator.tsx  # Main simulator
│   │   ├── BuildingToolbar.tsx       # Tool selection
│   │   ├── PropertiesPanel.tsx      # Element properties
│   │   ├── ProjectManager.tsx       # Project management
│   │   └── ProjectGallery.tsx       # Nostr project browser
│   ├── auth/                  # Authentication components
│   └── ui/                    # shadcn/ui components
├── hooks/                     # Custom React hooks
│   ├── useArchitecturalProjects.ts  # Nostr project queries
│   └── ...                    # Other Nostr hooks
├── types/                     # TypeScript type definitions
│   └── architecture.ts       # Architecture-specific types
└── pages/                     # Route components
    ├── Index.tsx             # Main simulator page
    └── Gallery.tsx           # Project gallery page
```

### Key Components

#### Scene3D
The main 3D rendering component that handles:
- Camera controls and positioning
- Lighting setup (ambient + directional)
- Grid rendering
- Element rendering and interaction
- View mode switching

#### BuildingElementMesh
Individual 3D elements with:
- Geometry generation based on element type
- Material application
- Selection highlighting
- Transform controls
- Hover effects

#### ArchitectureSimulator
The main application component that manages:
- Project state
- Element creation and modification
- Tool selection
- Panel visibility
- Project loading/saving

## Nostr Integration

### Event Types
- **Kind 30023**: Long-form content for architectural projects
- **Tags**: `architecture`, `3d-design`, plus custom project tags
- **Content**: JSON-serialized project data

### Data Format
```json
{
  "id": "unique-project-id",
  "name": "Project Name",
  "description": "Project description",
  "author": "npub...",
  "created_at": 1234567890000,
  "updated_at": 1234567890000,
  "elements": [
    {
      "id": "element-id",
      "type": "wall",
      "position": { "x": 0, "y": 1.5, "z": 0 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": { "x": 0.2, "y": 3, "z": 4 },
      "color": "#f3f4f6",
      "material": "concrete",
      "properties": {}
    }
  ],
  "metadata": {
    "style": "Modern",
    "scale": 1,
    "units": "metric",
    "tags": ["residential", "sustainable"]
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Three.js community for the amazing 3D library
- React Three Fiber team for the React integration
- Nostr protocol developers for the decentralized network
- shadcn for the beautiful UI components