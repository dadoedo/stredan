#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="stredan-app"
IMAGE_TAG="latest"
IMAGE_FILE="${IMAGE_NAME}.tar.gz"
REMOTE_HOST="alldevs-hetzner"
REMOTE_DIR="/root/stredan"

echo "==> Building Docker image..."
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

echo "==> Saving and compressing image..."
docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "${IMAGE_FILE}"

echo "==> Uploading to Hetzner ($(du -h "${IMAGE_FILE}" | cut -f1))..."
scp "${IMAGE_FILE}" "${REMOTE_HOST}:${REMOTE_DIR}/${IMAGE_FILE}"

echo "==> Loading image on server..."
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker load < ${IMAGE_FILE} && rm ${IMAGE_FILE}"

echo "==> Deploying containers..."
scp docker-compose.yml "${REMOTE_HOST}:${REMOTE_DIR}/docker-compose.yml"
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker compose up -d"

echo "==> Cleaning up local archive..."
rm -f "${IMAGE_FILE}"

echo "==> Done! Site should be live at https://www.stredan.sk"
