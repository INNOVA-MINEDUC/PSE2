# Basado en el Dockerfile de PSE-FINAL
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY . .

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN apk upgrade --no-cache libcrypto3 libssl3 \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --from=builder /app ./
RUN mkdir -p uploads && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "app.js"]
