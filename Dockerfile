# ---------- Stage 1 ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
 && node -e 'let p=require("./package.json"); delete p.devDependencies; require("fs").writeFileSync("package.runtime.json", JSON.stringify(p,null,2))'

# ---------- Stage 2 ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.runtime.json ./package.json
COPY fe-server.js ./
EXPOSE 3000
USER node
ENTRYPOINT ["node","fe-server.js"]
