# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.14.1
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY migrations ./migrations
RUN npm run build
FROM deps AS prod-deps
RUN npm prune --omit=dev
FROM deps AS dev
ENV NODE_ENV=development
# Dev chạy thẳng từ TypeScript nên migration cũng phải chạy qua ts-node.
ENV MIGRATION_SCRIPT=migration:run:dev
COPY . .
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
FROM node:${NODE_VERSION}-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# main.ts tự tạo uploads/images lúc bootstrap; tạo sẵn để user `node` ghi được
# ngay cả khi thư mục được mount volume.
RUN mkdir -p /app/uploads/images && chown -R node:node /app/uploads

USER node
EXPOSE 3000

# Chưa có endpoint /health nên dùng Swagger UI làm dấu hiệu app đã lên.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/docs').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
