#!/bin/sh
set -e

# Start nginx in the background
echo "Starting NGINX server ..."
nginx -g "daemon off;" &

# Start the API in the foreground
echo "Starting API server ..."
exec node back/build/index.cjs
