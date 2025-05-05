# him Extension

A Chrome Extension featuring an AI chatbot interface called "Him" for providing market insights directly within your browser's side panel. Now featuring gpt-4.1 integration for intelligent responses.

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

# Set up your OpenAI API key
# Copy the .env.example file to .env and add your OpenAI API key
cp .env.example .env
# Then edit the .env file with your actual API key

# Start development server
pnpm dev

# Build for production
pnpm build
```

### OpenAI Integration

This project uses OpenAI's gpt-4.1 model to provide intelligent responses in the chat interface. To set up the OpenAI integration:

1. Create an account at [OpenAI](https://openai.com) if you don't already have one
2. Generate an API key in your OpenAI dashboard
3. Add the API key to your `.env` file:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```
4. Restart your development server if it's already running

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
