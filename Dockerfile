FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=secret,id=npm_ca \
    if [ -s /run/secrets/npm_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/npm_ca; fi; \
    npm ci
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build:docker
FROM nginx:stable-alpine AS runtime
ENV IAM_UPSTREAM=http://iam:7001 MMMS_UPSTREAM=http://mmms:7010 STORAGE_UPSTREAM=http://storage:3052
ENV NGINX_ENVSUBST_FILTER=^(IAM_UPSTREAM|MMMS_UPSTREAM|STORAGE_UPSTREAM)$
COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend-docker/browser /usr/share/nginx/html
EXPOSE 80
