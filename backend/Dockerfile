FROM node:18-alpine AS base

WORKDIR /app

COPY package.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy only production dependencies
COPY --from=base /app/package.json ./
RUN npm install --only=production

COPY --chown=nodejs:nodejs src ./src

USER nodejs

EXPOSE 3000

# Production health check - comprehensive check of all dependencies
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/health/ready', timeout: 2000 }; const req = http.get(options, (res) => { if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } }); req.on('timeout', () => { req.destroy(); process.exit(1); }); req.on('error', () => process.exit(1));"

CMD ["node", "src/index.js"]

FROM node:18-alpine AS development

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy all dependencies (including dev dependencies) for development
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs src ./src

USER nodejs

EXPOSE 3000 9229

# Development health check - simpler check for dev environment
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1));"

CMD ["npm", "run", "dev"]