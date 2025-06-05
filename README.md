# Vitruvius Constructions

A web-based 3D architectural design tool that lets you create, share, and explore architectural projects on the Nostr network. Named after Marcus Vitruvius Pollio, the ancient Roman architect and engineer who wrote the foundational treatise "De Architectura".

## Features

### 🏗️ 3D Design Tools
- **Interactive 3D Scene**: Real-time 3D rendering with Three.js and React Three Fiber
- **Building Elements**: Walls, floors, roofs, windows, doors, columns, beams, and stairs
- **Material System**: Multiple materials including concrete, brick, wood, glass, steel, and stone
- **Color Customization**: Direct color editing with visual feedback
- **Transform Controls**: Interactive gizmos for position, rotation, and scale with drag-to-move functionality
- **Element Management**: Copy, delete, and reset elements with keyboard shortcuts (ESC to unselect)

### 🎨 User Experience
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Theme Support**: Dark/light mode with automatic system preference detection
- **Panel Management**: Collapsible left (tools) and right (properties) panels
- **Fullscreen Mode**: Immersive design environment with mobile-friendly controls
- **Flow State Design**: Optimized for focused, zen-like creative sessions

### 📐 Advanced Design Features
- **Smart View System**: Perspective, orthographic, top, front (north/south), and side (east/west) views
- **Directional Controls**: Toggle between different viewing directions for front and side views
- **Infinite Grid**: Visual reference grid with customizable spacing
- **Real-time Shadows**: Dynamic lighting and shadow casting for realistic visualization
- **Element Selection**: Click-to-select with visual highlighting and property editing
- **Custom Camera**: Manual camera control with automatic "custom view" detection

### 🌐 Nostr Integration
- **Decentralized Sharing**: Projects published as Kind 39266 Nostr events
- **Project Gallery**: Browse, search, and filter community projects in real-time
- **NIP-07 Authentication**: Login with browser extensions (Alby, nos2x, etc.)
- **Event Storage**: Projects stored on Nostr relays using custom tagging system
- **Author Profiles**: Display creator information with metadata from NIP-05
- **Real-time Discovery**: Live project updates from the Nostr network

### 💾 Project Management
- **Local Storage**: Export/import projects as JSON files for offline work
- **Project Metadata**: Rich metadata including name, description, tags, style, scale, and units
- **Element Analytics**: Real-time statistics on element count and breakdown
- **Version Tracking**: Automatic timestamps for creation and updates
- **Gallery Integration**: Load projects directly from the community gallery
- **Sample Projects**: Includes default project with sample architecture

## Getting Started

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** - Package manager (comes with Node.js)
- **A Nostr extension** (optional, for sharing projects):
  - [Alby](https://getalby.com/) - Browser extension wallet with Nostr support
  - [nos2x](https://github.com/fiatjaf/nos2x) - Simple Nostr extension
  - Any NIP-07 compatible extension

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vitruvius-constructions
   ```

2. **Install and start development**
   ```bash
   npm run dev
   ```
   This automatically installs dependencies and starts the dev server

3. **Open your browser**
   - Navigate to [http://localhost:8080](http://localhost:8080)
   - You should see the Vitruvius Constructions landing page

### Available Scripts

- `npm run dev` - Install dependencies and start development server with hot reload
- `npm run build` - Install dependencies, build for production, and create 404.html for SPA routing  
- `npm run test` - Run full test suite: TypeScript check, ESLint, Vitest, and build verification
- `npm run deploy` - Build and deploy to Surge.sh

### Building for Production
```bash
npm run build
```
The built files will be in the `dist/` directory with both `index.html` and `404.html` for proper SPA routing. Ready to deploy to any static hosting service.

## Usage

### Creating Your First Project
1. **Start Building**: Click "Start Building" on the landing page (goes to /projects if logged in, /create if not)
2. **Add Elements**: Use the left toolbar to select tools (walls, floors, windows, etc.) and click to add them to the scene
3. **Transform Elements**: Click any element to select it, then drag to move or use the properties panel for precise control
4. **Customize Properties**: Use the right properties panel to adjust position, scale, rotation, color, and material
5. **Change Views**: Use view controls to switch between perspective, orthographic, top, front, and side views
6. **Manage Project**: Use the Project Manager in the left panel to save, load, or share your design

### Keyboard Shortcuts
- **ESC** - Unselect current element
- **Fullscreen button** - Toggle fullscreen mode (hides panels on mobile)

### Working with Views
- **Perspective**: Default 3D view from (10, 10, 10)
- **Top**: Overhead view looking down from (0, 20, 0)
- **Front**: North/South views - click again to toggle direction
- **Side**: East/West views - click again to toggle direction  
- **Custom**: Automatically set when you manually move the camera
- **Camera Controls**: Orbit, pan, and zoom with mouse/touch

### Sharing on Nostr
1. **Login**: Click the login button in the header and connect your Nostr extension (NIP-07)
2. **Share Project**: Use the Project Manager's sharing features
3. **Add Metadata**: Fill in project name, description, style, and tags
4. **Publish**: Your project is published as a Kind 39266 event to the Nostr network
5. **Discover**: Other users can now find and load your project from the gallery

### Browsing the Gallery
- **Access**: Click "Gallery" in the header or "Explore Gallery First" on the landing page
- **Search & Filter**: Use the search bar and style filter to find specific projects
- **Preview**: Click "Preview" to see project details and element breakdown
- **Load**: Click "Load" to open any project in the simulator
- **Real-time Updates**: Gallery shows live projects from the Nostr network

## Architecture

### Technology Stack
- **React 18.3**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development with full type coverage
- **Three.js + React Three Fiber**: WebGL 3D graphics rendering
- **React Three Drei**: Helper components and utilities for R3F
- **Vite**: Fast build tool and development server (replaces Webpack)
- **Nostrify**: Modern Nostr protocol implementation for React
- **TailwindCSS 3.x**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible component library with 50+ components
- **TanStack Query**: Advanced server state management and caching
- **React Router 6**: Client-side routing with modern API

### Key Dependencies
- **@nostrify/nostrify**: Core Nostr protocol functionality
- **@nostrify/react**: React hooks and providers for Nostr
- **nostr-tools**: Nostr utilities for address decoding (NIP-19)
- **lucide-react**: Modern icon library
- **three**: 3D graphics library
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful abstractions for React Three Fiber

### Project Structure
```
src/
├── components/
│   ├── 3d/                     # 3D scene components
│   │   ├── Scene3D.tsx         # Main 3D canvas with lighting & camera
│   │   ├── BuildingElementMesh.tsx  # Individual 3D element rendering
│   │   └── SceneLoader.tsx     # 3D loading fallback component
│   ├── architecture/           # Architecture-specific UI components
│   │   ├── ArchitectureSimulator.tsx  # Main simulator container
│   │   ├── BuildingToolbar.tsx        # Element creation tools
│   │   ├── PropertiesPanel.tsx       # Element property editor
│   │   ├── ProjectManager.tsx        # Save/load/share functionality
│   │   └── ProjectGallery.tsx        # Community project browser
│   ├── auth/                   # Nostr authentication
│   │   └── LoginArea.tsx       # NIP-07 login interface
│   └── ui/                     # shadcn/ui component library (50+ components)
├── hooks/                      # Custom React hooks
│   ├── useVitruviusProjects.ts # Nostr project queries and filtering
│   ├── useNostrPublish.ts      # Event publishing functionality
│   ├── useCurrentUser.ts       # Authentication state management
│   ├── useAuthor.ts           # Author profile resolution (NIP-05)
│   └── useProjectManager.ts    # Project state management
├── types/
│   └── architecture.ts         # TypeScript definitions for all data structures
├── lib/
│   ├── projectStorage.ts       # File operations & Nostr serialization
│   └── utils.ts               # Utility functions and helpers
├── pages/                      # Route components for React Router
│   ├── Landing.tsx             # Marketing homepage with feature highlights
│   ├── Create.tsx             # Main simulator page with gallery integration
│   ├── Gallery.tsx            # Dedicated project discovery page
│   └── Projects.tsx           # User project management page
└── AppRouter.tsx               # Route definitions and navigation
```

### Key Components

#### ArchitectureSimulator
The main application component that manages:
- **Project State**: Element creation, selection, and modification
- **Tool Management**: Building tool selection and active state 
- **View Control**: Camera positioning and view mode switching
- **Panel Management**: Left/right panel visibility and fullscreen mode
- **Data Persistence**: Project loading/saving and localStorage integration
- **Keyboard Shortcuts**: ESC key handling for element deselection

#### Scene3D  
The main 3D rendering component that handles:
- **Camera System**: OrbitControls with preset position management
- **Lighting Setup**: Ambient + directional lighting with shadow mapping
- **Environment**: Infinite grid system and background gradients
- **Element Rendering**: Managing all 3D meshes and their interactions
- **Transform Controls**: Interactive gizmos for selected elements
- **View Transitions**: Smooth camera movement between preset views

#### BuildingElementMesh
Individual 3D elements with:
- **Dynamic Geometry**: Procedural generation based on element type (box, cylinder, cone)
- **Material System**: PBR materials with transparency and color support
- **Interaction**: Click selection, hover effects, and pointer cursor changes
- **Visual Feedback**: Selection highlighting with wireframe overlay
- **Shadow Casting**: Real-time shadow casting and receiving

## Nostr Integration

### Protocol Implementation
- **Event Kind**: 39266 (Custom addressable event for architectural projects)
- **Relay**: Currently uses `wss://ditto.pub/relay` as the primary relay
- **Authentication**: NIP-07 browser extension support (Alby, nos2x, etc.)
- **Queries**: Real-time project discovery with 10-second timeout protection
- **Caching**: 5-minute query cache with TanStack Query for performance

### Event Structure
- **Kind 39266**: Addressable event for projects
- **Tags System**: Comprehensive tagging with custom fields:
  - `d` (identifier): Unique project identifier with "vitruvius-" prefix
  - `title`: Project name for discovery
  - `description`: Project description
  - `style`: Architectural style (Modern, Classical, etc.)  
  - `scale`, `units`, `elements`: Technical metadata
  - `t`: Searchable tags for filtering
  - `created_at`: Timestamp metadata
- **Content**: JSON-serialized project data with full element information

### Project Data Structure
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

### Query Features
- **Real-time Discovery**: Live updates from Nostr relays
- **Search & Filter**: Text search across names, descriptions, and tags
- **Style Filtering**: Filter by architectural style categories
- **Author Lookup**: Display creator profiles with NIP-05 verification
- **Pagination**: Limit queries to 50 projects for performance
- **Error Handling**: Graceful fallbacks for malformed project data

## Development

### Testing Your Changes
Always test your changes after modification by running:
```bash
npm run test
```
This command performs:
- **TypeScript Check**: Ensures type safety across the codebase
- **ESLint**: Code quality and consistency verification
- **Vitest**: Unit test execution
- **Build Verification**: Confirms production build works correctly

Your development work is not considered complete until this test passes without errors.

### Code Style
- **TypeScript**: Strict typing is enforced
- **ESLint**: Automatic code quality checks
- **Component Structure**: Functional components with hooks
- **File Organization**: Clear separation of concerns by feature

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the existing code patterns
4. Run `npm run test` to ensure all checks pass  
5. Test the application thoroughly in the browser
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request with a clear description

## Deployment

### Automatic Deployment
```bash
npm run deploy
```
This command:
1. Builds the project for production
2. Deploys to Surge.sh automatically
3. Includes proper SPA routing with 404.html fallback

### Manual Deployment
The project can be deployed to any static hosting service:
- **Netlify**: Drag and drop the `dist/` folder
- **Vercel**: Connect your GitHub repository  
- **GitHub Pages**: Enable Pages in repository settings
- **Firebase Hosting**: Use Firebase CLI tools

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Three.js community for the amazing 3D library
- React Three Fiber team for the React integration
- Nostr protocol developers for the decentralized network
- shadcn for the beautiful UI components