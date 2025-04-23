# Kadena Indexer - Infrastructure Configuration

### 🚀 Getting Started

- [Introduction](#1-introduction)
- [Prerequisites](#2-prerequisites)

### ⚙️ Configuration

- [Environment Setup](#3-environment-setup)
  - [Configure Variables](#31-configure-environment-variables)
  - [Variables Reference](#32-environment-variables-reference)

### 🐳 Docker Setup

- [Starting Docker](#41-starting-docker)
- [Dev Container](#42-dev-container)
- [Running Options](#43-running-with-docker)
  - [Basic Docker Run](#43-running-with-docker)
  - [Docker Compose](#44-running-with-docker-compose)
  - [Temporary Containers](#45-running-separately-with-temporary-containers)

## 1. Introduction

This directory contains the instructions on how to set up the Docker container for the Kadena indexer, configure the environment variables, and run the indexer. We present two options for running the indexer, by using Docker Compose or running the services separately.

## 2. Prerequisites

- [Docker](https://www.docker.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VSCode or Cursor (optional)
- Installed dependencies
- PostgreSQL (will be run in Docker)
- Sufficient disk space for Docker images and blockchain data
- Internet connection to access Kadena node API

## 3. Environment Setup

### 3.1. Configure Environment Variables

Under the `/indexer` directory, run the following command to create an `.env` file using the `.env.template` as a reference:

```bash
cp indexer/.env.template indexer/.env
```

### 3.2. Environment Variables Reference

| Variable                        | Description                          | Example                                 |
| ------------------------------- | ------------------------------------ | --------------------------------------- |
| `NODE_API_URL`                  | Base URL for the Kadena node API     | `https://api.chainweb.com`              |
| `SYNC_BASE_URL`                 | Base URL for the Chainweb API        | `https://api.chainweb.com/chainweb/0.0` |
| `SYNC_MIN_HEIGHT`               | Minimum height to start syncing from | `0`                                     |
| `SYNC_FETCH_INTERVAL_IN_BLOCKS` | Interval in blocks to fetch          | `100`                                   |
| `SYNC_NETWORK`                  | Network to sync                      | `mainnet01`, `testnet04`, `devnet`      |
| `KADENA_GRAPHQL_API_URL`        | GraphQL API host                     | `localhost`                             |
| `KADENA_GRAPHQL_API_PORT`       | GraphQL API port                     | `3000`                                  |
| `DB_USERNAME`                   | PostgreSQL database username         | `postgres`                              |
| `DB_PASSWORD`                   | PostgreSQL database password         | `your_password`                         |
| `DB_NAME`                       | PostgreSQL database name             | `indexer`                               |
| `DB_HOST`                       | PostgreSQL database host             | `localhost`                             |
| `DB_SSL_ENABLED`                | Enable/disable SSL for database      | `true` or `false`                       |

**NOTE:** The example Kadena node API from chainweb will not work for the indexer purpose. You will need to run your own Kadena node and set the `NODE_API_URL` to your node's API URL.

## 4. Docker Setup

### 4.1. Starting Docker

Start Docker Desktop from command line or via IOS application.

```bash
# MacOS - Start Docker Desktop from command line
open -a Docker

# Linux - Start Docker daemon
sudo systemctl start docker
```

**NOTE:** Make sure to check the `.env` file to set the correct environment variables.

### 4.2. Dev Container

This project is configured to run in a dev container. You can use the `Dev Containers: Open Folder in Container` command in VSCode to open the project in a dev container. This will automatically install the required dependencies and set up the environment. To use the dev container, you need to have Docker installed on your machine.

If you don't have Dev Containers installed, you can install it from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

### 4.3. Running with Docker

```bash
# Build a Docker image named 'kadena-indexer' using the Dockerfile in current directory
sudo docker build -t kadena-indexer:latest .
# Run a container from the image, load environment variables from .env file, and map port 3000
sudo docker run --env-file ./indexer/.env -p 3000:3000 kadena-indexer:latest
```

### 4.4. Running with Docker Compose

Docker Compose provides a way to run the entire indexer stack with a single command. While you could run each service separately (database, migrations, GraphQL server, and streaming service), Docker Compose orchestrates all these components together, handling their dependencies and startup order automatically. The services are defined in `docker-compose.yml`, which includes:

- PostgreSQL database
- Database migrations
- GraphQL API server
- Streaming indexer service

To start all services:

```bash
$ yarn compose:up
$ yarn compose:down
```

**NOTE:** Using the image on with the composer require the database `DB_USERNAME` to default to `postgres`.

### 4.5. Running Postgres Container

This workflow will start the PostgreSQL database in a temporary container. Remove the `--rm` flag to keep the container running after the command is finished.

```bash
# First, load the environment variables from .env
source .env

# Then run the container using the environment variables
docker run --rm --name postgres-indexer \
    -e POSTGRES_USER=$DB_USERNAME \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -e POSTGRES_DB=$DB_NAME \
    -p 5432:5432 \
    postgres
```

## 5. Indexer

### 5.1. Running the Indexer

Assuming you've already started the Docker container, you can run the following commands to start the indexer:

**Note**: Run each command in a separate terminal window -- with exeption of `yarn create:database`, as they are long-running process.

```bash
# Run the database migrations
yarn create:database

# Start the streaming service
yarn dev:streaming

# Start the GraphQL server with hot reload
yarn dev:hot:graphql
```

### 5.2. Additional Commands

The following commands will aid in the maintenance of the indexer.

```bash
# Identifying Missing Blocks - Scan for and store any blocks that were missed.
yarn dev:missing

# Processing Headers - Start the header processing from S3 to the database.
yarn dev:headers

# Processing Payloads - Start the payload processing from S3 to the database.
yarn dev:payloads

# Update GraphQL - Makers a hot reload (without building)
yarn dev:hot:graphql

# Generate GraphQL types - Generate the GraphQL types from the schema.
yarn graphql:generate-types

# Run the pagination tests offline
yarn test
```

### 5.3. Local Workflow Testing

**NOTE:** This is not being actively maintained at the moment.

Install act for local testing:

```bash
# For MacOS
brew install act

# For Linux
sudo apt-get update
sudo apt-get install act
```

Then run the indexer workflow by using the following command:

```bash
yarn run-indexer-workflow
```
