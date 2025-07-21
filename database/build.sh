#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found."
    exit 1
fi

# Export variables from .env file
export $(grep -v '^#' .env | xargs)

# Check for required variables
if [ -z "$SYNC_NETWORK" ] || [ -z "$BACKUP_HOST_IP" ]; then
    echo "Error: SYNC_NETWORK and BACKUP_HOST_IP must be set in .env"
    exit 1
fi

# Substitute variables in script.sh.template
envsubst < ./script.sh.template > ./script.sh.generated

# Substitute variables in pgbackrest.conf.template
envsubst < ./pgbackrest.conf.template > ./pgbackrest.conf.generated

# Build the Docker image
docker build -f Dockerfile.customdb -t custom-db:${SYNC_NETWORK} .

# Clean up generated files
rm script.sh.generated
rm pgbackrest.conf.generated

echo "Docker image 'custom-db' built successfully."