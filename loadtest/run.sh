#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:?Вкажіть адресу сервісу, напр. http://atomsapi-abc12.swedencentral.cloudapp.azure.com}"
VUS="${2:-40}"
THINK="${3:-1}"
DIR="$(cd "$(dirname "$0")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DIR/results"

docker run --rm -i --user "$(id -u):$(id -g)" \
  -e BASE_URL="$BASE_URL" -e VUS="$VUS" -e THINK="$THINK" -e RUN_ID="$STAMP" \
  -v "$DIR:/loadtest:Z" \
  grafana/k6:latest run \
  --summary-export "/loadtest/results/summary-$STAMP.json" \
  /loadtest/script.js | tee "$DIR/results/report-$STAMP.txt"
