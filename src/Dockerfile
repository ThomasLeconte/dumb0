# ========== STAGE 1: Backend Build ==========
# Utilise une image avec les outils de build necessaires
FROM node:24.15.0-alpine AS backend-builder

# Installe les dependances necessaires pour compiler better-sqlite3
ENV PYTHONUNBUFFERED=1
RUN apk add --no-cache python3 make git && \
    ln -sf python3 /usr/bin/python && \
    npm install -g node-gyp@latest

WORKDIR /build/back
COPY src/back/package.json src/back/package-lock.json ./
COPY src/back/tsconfig.json ./tsconfig.json
COPY src/back ./src/back
COPY src/commons ./src/commons

RUN npm install && \
    npm prune && \
    npm run build

# ========== STAGE 2: Frontend Build ==========
FROM node:24.15.0-alpine AS frontend-builder

ARG VITE_PRIMEVUE_LICENCE_KEY=none
WORKDIR /build/front
COPY src/front ./
COPY src/commons ../commons
RUN echo "VITE_PRIMEVUE_LICENCE_KEY=${VITE_PRIMEVUE_LICENCE_KEY}" > .env

RUN npm install && \
    npm prune && \
    npm run build

# ========== STAGE 3: Final Image ==========
FROM node:24.15.0-alpine AS final

# Install NGINX (without build tools)
RUN apk add --no-cache nginx

# Create nginx folders
RUN mkdir -p /srv/dumb0/back/dist/back/src && \
    mkdir -p /usr/share/nginx/html

# Copy built API from backend-builder
COPY --from=backend-builder /build/back/dist/back ./srv/dumb0/back
COPY --from=backend-builder /build/back/package.json ./srv/dumb0/back/package.json
COPY --from=backend-builder /build/back/node_modules ./srv/dumb0/back/node_modules

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