FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev
WORKDIR /app
COPY package*.json tsconfig.json vite.config.ts ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runner
RUN apk add --no-cache cairo pango jpeg giflib librsvg
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5784
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
VOLUME ["/app/data"]
EXPOSE 5784
USER node
CMD ["node", "dist/index.js"]
