#!/bin/sh
set -e
echo "Running Payload migrations..."
node_modules/.bin/payload migrate
echo "Migrations done. Starting Next.js..."
node_modules/.bin/next start
