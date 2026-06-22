#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.local}"
PROJECT_REF="iqawtocqexrvhwpcdlbd"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Fichier $ENV_FILE introuvable."
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

required=(
  STRIPE_SECRET_KEY
  STRIPE_PRICE_PREMIUM
  KIE_AI_API_KEY
  APP_URL
)

optional=(
  STRIPE_WEBHOOK_SECRET
  STRIPE_PRICE_DECOUVERTE
  STRIPE_PRICE_REGULIERE
  STRIPE_PRICE_ADDICT
)

missing=()
for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Variables obligatoires manquantes dans $ENV_FILE :"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

push_via_api() {
  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    echo "SUPABASE_ACCESS_TOKEN manquant."
    echo "Crée un token ici : https://supabase.com/dashboard/account/tokens"
    echo "Puis ajoute dans .env.local : SUPABASE_ACCESS_TOKEN=sbp_..."
    exit 1
  fi

  local payload
  payload=$(python3 - <<'PY'
import json, os

required = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PRICE_PREMIUM",
    "KIE_AI_API_KEY",
    "APP_URL",
]
optional = [
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_DECOUVERTE",
    "STRIPE_PRICE_REGULIERE",
    "STRIPE_PRICE_ADDICT",
]

secrets = []
for key in required + optional:
    value = os.environ.get(key, "")
    if value:
        secrets.append({"name": key, "value": value})

print(json.dumps(secrets))
PY
)

  echo "Push des secrets via API Supabase ($PROJECT_REF)..."
  http_code=$(curl -s -o /tmp/supabase-secrets-response.txt -w "%{http_code}" \
    -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if [[ "$http_code" != "201" && "$http_code" != "200" ]]; then
    echo "Erreur API Supabase (HTTP $http_code) :"
    cat /tmp/supabase-secrets-response.txt
    exit 1
  fi
  echo "OK — secrets Supabase mis à jour (API)."
}

push_via_cli() {
  local args=(
    "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
    "STRIPE_PRICE_PREMIUM=$STRIPE_PRICE_PREMIUM"
    "KIE_AI_API_KEY=$KIE_AI_API_KEY"
    "APP_URL=$APP_URL"
  )
  for key in "${optional[@]}"; do
    if [[ -n "${!key:-}" ]]; then
      args+=("$key=${!key}")
    fi
  done

  local cmd="supabase"
  if ! command -v supabase >/dev/null 2>&1; then
    cmd="npx supabase"
  fi

  echo "Push des secrets via CLI Supabase ($PROJECT_REF)..."
  $cmd secrets set --project-ref "$PROJECT_REF" "${args[@]}"
  echo "OK — secrets Supabase mis à jour (CLI)."
}

export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"
export STRIPE_PRICE_DECOUVERTE="${STRIPE_PRICE_DECOUVERTE:-}"
export STRIPE_PRICE_REGULIERE="${STRIPE_PRICE_REGULIERE:-}"
export STRIPE_PRICE_ADDICT="${STRIPE_PRICE_ADDICT:-}"

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  push_via_api
else
  push_via_cli
fi
