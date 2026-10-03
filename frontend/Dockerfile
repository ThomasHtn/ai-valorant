# syntax=docker/dockerfile:1

# ---- Build stage ------------------------------------------------------------
# Builds the production Angular bundle. Quality gates (prettier, vitest) run before an image is
# built, so this stage only produces the artifact.
FROM node:22-alpine AS build
WORKDIR /workspace

# Dependencies first, so this layer is only rebuilt when the lock file changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ----------------------------------------------------------
# nginx serves the built SPA. Traefik (see docker-compose.prod.yml) terminates HTTPS and routes
# /api/* to the backend on the same origin.
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
