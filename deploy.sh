#!/usr/bin/env bash
# Emergency / manual deploy. Prefer GitHub Actions on main (Deploy stredan).
set -euo pipefail

IMAGE_NAME="${STREDAN_IMAGE:-ghcr.io/dadoedo/stredan}"
IMAGE_TAG="${IMAGE_TAG:-prod}"
IMAGE_FILE="stredan-app.tar.gz"
REMOTE_HOST="${REMOTE_HOST:-alldevs-hetzner}"
REMOTE_DIR="${REMOTE_DIR:-/root/stredan}"
COMPOSE_FILE="deploy/docker-compose.prod.yml"

echo "==> Building Docker image ${IMAGE_NAME}:${IMAGE_TAG}..."
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

echo "==> Saving and compressing image..."
docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "${IMAGE_FILE}"

echo "==> Uploading to ${REMOTE_HOST} ($(du -h "${IMAGE_FILE}" | cut -f1))..."
ssh "${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}/deploy"
scp "${IMAGE_FILE}" "${REMOTE_HOST}:${REMOTE_DIR}/${IMAGE_FILE}"

echo "==> Loading image on server..."
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker load < ${IMAGE_FILE} && rm -f ${IMAGE_FILE}"

echo "==> Syncing deploy manifests..."
scp deploy/docker-compose.prod.yml deploy/stredan.caddy deploy/.env.example \
  "${REMOTE_HOST}:${REMOTE_DIR}/deploy/"

echo "==> Ensuring .env exists on server..."
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && if [[ ! -f .env ]]; then cp deploy/.env.example .env && chmod 600 .env && echo 'Created .env from example — edit ADMIN_PASSWORD'; fi"

echo "==> Deploying containers..."
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && \
  export STREDAN_IMAGE='${IMAGE_NAME}' IMAGE_TAG='${IMAGE_TAG}' && \
  docker compose --project-directory . -f ${COMPOSE_FILE} up -d --no-build --remove-orphans"

echo "==> Cleaning up local archive..."
rm -f "${IMAGE_FILE}"

echo "==> Done! https://www.stredan.sk"
