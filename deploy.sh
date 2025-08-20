#!/bin/bash

# Check if mode parameter is provided
if [ -z "$1" ]; then
    echo "Error: Please provide a mode (graphql, streaming, or missing)"
    echo "Usage: ./deploy.sh <mode>"
    exit 1
fi

MODE=$1
INDEXER_MODE_PARAM="--$MODE"

# Build the image with the specified mode
docker build --build-arg INDEXER_MODE_PARAM=$INDEXER_MODE_PARAM --no-cache -t kadindexer-ecr:$MODE-v1.0.2.1 .

# Tag the image
docker tag kadindexer-ecr:$MODE-v1.0.2.1 325501467038.dkr.ecr.us-east-1.amazonaws.com/kadindexer-ecr:$MODE-v1.0.2.1

# Push to ECR
docker push 325501467038.dkr.ecr.us-east-1.amazonaws.com/kadindexer-ecr:$MODE-v1.0.2.1