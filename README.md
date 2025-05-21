> Disclaimer: This is only a MVP, the code is pretty messy. We are working on a better extension made in React with WXT. An actual, well-thought architecture is developed for the future.

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

## Status

This is currently a UI prototype. Future versions will integrate with real market data and AI analysis.
