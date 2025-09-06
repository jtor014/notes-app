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

CMD ["npm", "run", "dev"]