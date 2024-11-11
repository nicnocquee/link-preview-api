## Development

```bash
# Install dependencies
npm install

# Run local redis
docker-compose up redis

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
