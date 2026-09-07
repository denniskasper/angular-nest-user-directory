# syntax=docker/dockerfile:1

# One image, one process: Node runs the API and serves the built frontend
# beside it (apps/api/src/app/serve-frontend.ts), so the browser's relative
# `/api` requests need neither a proxy nor CORS. Two stages, so neither the
# workspace's node_modules nor the build toolchain ends up in what runs.

FROM node:22-alpine AS build
WORKDIR /app

# Manifests first, then sources, so the dependency layer survives any change
# that leaves package-lock.json alone. The cache mount keeps npm's own store
# between builds, so a changed lockfile refetches only what changed.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Only what the two builds read, copied one by one: a change to the README,
# the tickets or the browser specs must not invalidate the layer below.
# The root eslint and vitest configs are there because Nx's plugins load
# them while computing the project graph, even for a build.
COPY nx.json tsconfig.base.json eslint.config.mjs vitest.config.mts ./
COPY libs ./libs
COPY apps/api ./apps/api
COPY apps/frontend ./apps/frontend

# No daemon inside a build container, and no reuse of a local cache.
ENV NX_DAEMON=false CI=true
RUN npx nx run-many -t build -p api frontend --skip-nx-cache

FROM node:22-alpine AS serve
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data \
    STATIC_DIR=/app/public
WORKDIR /app

# The API build writes a package.json and lockfile naming only what the
# bundle requires at runtime (five packages and their dependencies), so this
# install is small and has nothing to do with the workspace's devDependencies.
COPY --from=build /app/dist/apps/api/package.json /app/dist/apps/api/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

COPY --from=build /app/dist/apps/api/main.js ./
COPY --from=build /app/dist/apps/api/assets ./assets
COPY --from=build /app/dist/apps/frontend/browser ./public

# The store lives outside the image. Mount a volume at /data to keep created
# Users across deployments; without one, every new container starts from the
# Seed Data again (README, Deployment).
RUN mkdir /data && chown node:node /data
USER node

EXPOSE 3000

# The root of the API costs no file access and no store lookup.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/api" || exit 1

CMD ["node", "main.js"]
