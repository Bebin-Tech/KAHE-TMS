#!/bin/sh
set -eu

npm ci --prefix frontend
VITE_BASE_PATH=/ VITE_API_BASE_URL=/api/ npm run build --prefix frontend
cp -R frontend/dist public

if [ "${KAHE_RUN_MIGRATIONS:-0}" = 1 ]; then
    .vercel/python/.venv/bin/python backend/manage.py migrate --settings=tms_project.settings --noinput
fi
