# ---------- Stage 1: install production deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only manifests
COPY package.json package-lock.json ./

# Install ONLY production deps (honors overrides; no dev deps)
RUN npm ci --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Bring in production node_modules only
COPY --from=deps /app/node_modules ./node_modules

# Copy minimal runtime files (avoid bringing lockfile back in)
# Add other needed files (e.g., public/, views/, src/ if your server reads them at runtime)
COPY package.json ./
COPY fe-server.js ./

EXPOSE 3000
USER node
ENTRYPOINT ["node","fe-server.js"]
