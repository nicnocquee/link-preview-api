# Link Preview API

Get the title, description, and image for a URL.

## Usage

```bash
# Get the preview for a URL
curl "http://localhost:3000/api/v1/preview?url=https://www.nico.fyi/blog/llm-instructions-for-v0-and-gpt"
```

The response will be a JSON object:

```json
{
  "title": "Instructions for v0 and GPT to generate high quality React code",
  "description": "Discover proven instructions to enhance AI code generation with v0 and GPT. Learn how to get cleaner, maintainable TypeScript React components using custom prompts that follow best practices for hooks, server components, and TypeScript.",
  "image": "https://www.nico.fyi/static/screenshots/blog/llm-instructions-for-v0-and-gpt.webp",
  "url": "https://www.nico.fyi/blog/llm-instructions-for-v0-and-gpt"
}
```

## Development

```bash
# Install dependencies
npm install

# Run local redis
docker-compose -f docker-compose.dev.yml up

# Run in development mode with auto-reload
npm run dev
```

Docker commands:

```bash
# Build the Docker images
npm run docker:build

# Start the containers
npm run docker:up

# Start in detached mode (background)
npm run docker:up -- -d

# View logs
npm run docker:logs

# Stop and remove containers
npm run docker:down
```

## Production

```bash
# Start the application
npm start
```
