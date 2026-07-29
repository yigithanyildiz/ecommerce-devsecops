#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-https://api.yigithanyildiz.com}"
ADMIN_URL="${ADMIN_URL:-https://admin.yigithanyildiz.com}"

pass() {
  printf "PASS %s\n" "$1"
}

check_contains() {
  local label="$1"
  local url="$2"
  local expected="$3"

  local body
  body="$(curl -fsS --max-time 15 "$url")"

  if [[ "$body" != *"$expected"* ]]; then
    printf "FAIL %s\n" "$label"
    printf "Expected response from %s to contain: %s\n" "$url" "$expected"
    exit 1
  fi

  pass "$label"
}

check_contains "API health" "$API_URL/health" '"status":"ok"'
check_contains "Product catalog" "$API_URL/products" '"name"'
check_contains "Storefront config" "$API_URL/storefront" '"heroTitle"'
check_contains "Admin web" "$ADMIN_URL" '<div id="root"></div>'

printf "\nSmoke test completed successfully.\n"
printf "API: %s\n" "$API_URL"
printf "Admin: %s\n" "$ADMIN_URL"
