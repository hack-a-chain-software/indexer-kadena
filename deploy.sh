#!/bin/bash

# Check if mode parameter is provided
if [ -z "$1" ]; then
    echo "Error: Please provide a mode (graphql, streaming, or missing)"
    echo "Usage: ./deploy.sh <mode>"
    exit 1
fi

MODE=$1

# Build the image with the specified mode
docker build --build-arg NODE_MODE=$MODE --no-cache -t kadindexer-ecr:$MODE .

# Tag the image
docker tag kadindexer-ecr:$MODE 325501467038.dkr.ecr.us-east-1.amazonaws.com/kadindexer-ecr:$MODE

# Push to ECR
docker push 325501467038.dkr.ecr.us-east-1.amazonaws.com/kadindexer-ecr:$MODE