# Him AI Trading Buddy Extension

A Chrome Extension featuring an AI chatbot interface called "Him" for providing market insights directly within your browser's side panel.

## Features

- **Atmospheric UI**: Dark space/nebula theme with glow effects
- **Animated Background**: Dynamic animated background with stars and nebula effect
- **Chat Interface**: Displays market sentiment, analysis, and response messages
- **Side Panel Integration**: Seamlessly integrates with Chrome's side panel API

## Tech Stack

- **SvelteKit**: UI framework and component system
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first styling
- **Chrome Extensions API**: Manifest V3 with Side Panel support

## Development

### Prerequisites

- Node.js (LTS recommended)
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Loading the Extension

1. Build the project: `pnpm build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `build` directory

## Project Structure

- `/src`: SvelteKit app code
  - `/routes`: SvelteKit routes
  - `/lib/components`: Reusable Svelte components
- `/static`: Static assets and extension files
  - `manifest.json`: Chrome extension manifest
  - `background.js`: Service worker
- `/build`: Built extension (after running `pnpm build`)

## Status

This is currently a UI prototype. Future versions will integrate with real market data and AI analysis.
