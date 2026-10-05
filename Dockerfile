# syntax=docker/dockerfile:1

############################################
# Stage 1 - build the React frontend
############################################
FROM node:20-slim AS frontend-build
WORKDIR /build

# Served same-origin behind nginx, so API calls are relative ("/api").
ENV REACT_APP_BACKEND_URL=""

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./
RUN yarn build

############################################
# Stage 2 - runtime: nginx + FastAPI + MongoDB
############################################
FROM ubuntu:22.04 AS runtime
ENV DEBIAN_FRONTEND=noninteractive

# MongoDB (multi-arch), Python, nginx, supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl gnupg python3 python3-pip nginx supervisor \
 && curl -fsSL https://pgp.mongodb.com/server-7.0.asc \
      | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor \
 && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
      > /etc/apt/sources.list.d/mongodb-org-7.0.list \
 && apt-get update && apt-get install -y --no-install-recommends mongodb-org \
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

# MongoDB data dir (ephemeral unless a volume is mounted here)
RUN mkdir -p /data/db

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/surgical-ai.conf"]
