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

RUN apk --no-cache upgrade

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.runtime.json ./package.json

# 👇 Add this line
COPY config ./config

COPY fe-server.js ./
COPY public ./public   # (you also read ./public/default.css)

EXPOSE 3000
USER node
ENTRYPOINT ["node","fe-server.js"]