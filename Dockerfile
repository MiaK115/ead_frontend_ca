FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

USER node
ENTRYPOINT ["node", "fe-server.js"]   # or "src/server.js" if that's your entry file