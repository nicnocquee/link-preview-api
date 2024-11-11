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

## Domain Mappings

The API supports custom domain mappings for scenarios where you need to redirect requests to specific IP addresses and ports. This is useful for testing or when dealing with internal networks.

Configure domain mappings using the `DOMAIN_MAPPINGS` environment variable in the format:

```
DOMAIN_MAPPINGS=domain1:ip:port,domain2:ip:port
```

Example:

```
DOMAIN_MAPPINGS=api.internal:192.168.1.100:8080,test.local:10.0.0.50:3000
```

This will map:

- Requests to api.internal → 192.168.1.100:8080
- Requests to test.local → 10.0.0.50:3000

## Caching

The API implements Redis-based caching to improve performance and reduce redundant requests. When a URL is requested, the API first checks if a cached preview exists. If found, it returns the cached data instead of fetching it again.

Configuration:

- `CACHE_DURATION`: Duration in seconds to cache previews (defaults to 3600 seconds/1 hour)

## Rate Limiting

To prevent abuse, the API includes Redis-based rate limiting per IP address.

Configuration:

- `RATE_LIMIT_WINDOW`: Time window in milliseconds (defaults to 15 minutes)
- `RATE_LIMIT_MAX`: Maximum number of requests per IP within the window (defaults to 100 requests)

When the rate limit is exceeded, the API returns a 429 status code with the message "Too many requests from this IP, please try again later."

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
