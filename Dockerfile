# syntax=docker/dockerfile:1

############################################
# Stage 1 - build the React frontend
############################################
FROM node:20-slim AS frontend-build
WORKDIR /build

# Served same-origin behind nginx, so API calls are relative ("/api").
ENV REACT_APP_BACKEND_URL=""

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn config set strict-ssl false && yarn install --frozen-lockfile
COPY frontend/ ./
RUN yarn build

############################################
# Stage 2 - runtime: nginx + FastAPI + SQLite
############################################
FROM ubuntu:22.04 AS runtime
ENV DEBIAN_FRONTEND=noninteractive

# Python, nginx, supervisor, sqlite3 CLI (handy for ops/debug)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl python3 python3-pip nginx supervisor sqlite3 \
 && rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip3 install --no-cache-dir -r /app/backend/requirements.txt

# App code
COPY backend/ /app/backend/

# Built frontend -> nginx web root
COPY --from=frontend-build /build/build /var/www/html

# nginx + supervisor config
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/surgical-ai.conf

# SQLite data dir - mount a volume here for persistence:
#   docker run -v surgical-ai-data:/data ...
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 9999
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/surgical-ai.conf"]
