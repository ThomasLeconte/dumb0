# ========== STAGE 1: Backend Build ==========
FROM node:24.15.0-alpine AS backend-builder

WORKDIR /build/back
COPY src/back/package.json src/back/package-lock.json ./
COPY src/back/tsconfig.json ./tsconfig.json
COPY src/back ./
COPY src/commons ../commons

RUN npm ci && \
    npm run build

# ========== STAGE 2: Frontend Build ==========
FROM node:24.15.0-alpine AS frontend-builder

ARG VITE_PRIMEVUE_LICENCE_KEY=none
ARG POSTHOG_KEY=none
WORKDIR /build/front
COPY src/front ./
COPY src/commons ../commons
RUN echo "VITE_PRIMEVUE_LICENCE_KEY=${VITE_PRIMEVUE_LICENCE_KEY}" > .env
RUN echo "VITE_POSTHOG_KEY=${POSTHOG_KEY}" >> .env

RUN npm install && \
    npm prune && \
    npm run build

# ========== STAGE 3: Final Image ==========
FROM node:24.15.0-alpine AS final

# Install NGINX (without build tools)
RUN apk add --no-cache nginx

# Create nginx folders
RUN mkdir -p /srv/dumb0/back && \
    mkdir -p /usr/share/nginx/html

# Copy bundled API from backend-builder (single self-contained file, no node_modules needed)
COPY --from=backend-builder /build/back/build ./srv/dumb0/back/build

# Copy build front from frontend-builder
COPY --from=frontend-builder /build/front/dist ./srv/dumb0/front
COPY --from=frontend-builder /build/front/nginx.conf /etc/nginx/http.d/default.conf

# Copy commons model folder and start script
COPY src/start.sh /srv/dumb0/start.sh
COPY src/commons /srv/dumb0/commons

# Transfer frontend build to nginx folder and change permissions to execute start script
RUN cp -r /srv/dumb0/front/. /usr/share/nginx/html/ && \
    chmod +x /srv/dumb0/start.sh

WORKDIR /srv/dumb0

# Ports
EXPOSE 3000
EXPOSE 80

ENV NODE_ENV=production

CMD ["/srv/dumb0/start.sh"]