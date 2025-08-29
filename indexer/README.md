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

| Variable                  | Description                             | Example                                 |
| ------------------------- | --------------------------------------- | --------------------------------------- |
| `NODE_API_URL`            | Base URL for the Kadena node API        | `https://api.chainweb.com`              |
| `SYNC_BASE_URL`           | Base URL for the Chainweb API           | `https://api.chainweb.com/chainweb/0.0` |
| `SYNC_NETWORK`            | Network to sync                         | `mainnet01`, `testnet04`, `devnet`      |
| `DB_USERNAME`             | PostgreSQL database username            | `postgres`                              |
| `DB_PASSWORD`             | PostgreSQL database password            | `your_password`                         |
| `DB_NAME`                 | PostgreSQL database name                | `indexer`                               |
| `DB_HOST`                 | PostgreSQL database host                | `localhost`                             |
| `DB_SSL_ENABLED`          | Enable/disable SSL for database         | `true` or `false`                       |
| `KADENA_GRAPHQL_API_PORT` | GraphQL API port                        | `3000`                                  |
| `SENTRY_DSN`              | Sentry url to monitor indexer usage     | `https://123.ingest.us.sentry.io/123`   |
| `ALLOWED_ORIGINS`         | Allowed origins for CORS                | `http://abcde:3001,http://abcde:3002`   |
| `PRICE_CACHE_TTL`         | Time-to-live for price cache in seconds | `300`                                   |

### 3.3. Optional ClickHouse Integration

When ClickHouse is configured, the indexer can index/search Pact code efficiently.

Environment Variables:

| Variable                     | Description                                            | Example                 |
| ---------------------------- | ------------------------------------------------------ | ----------------------- |
| `CLICKHOUSE_URL`             | ClickHouse endpoint (enables health and clients)       | `http://localhost:8123` |
| `CLICKHOUSE_USER`            | ClickHouse username (optional)                         | `default`               |
| `CLICKHOUSE_PASSWORD`        | ClickHouse password (optional)                         | `secret`                |
| `CLICKHOUSE_DATABASE`        | ClickHouse database (optional)                         | `default`               |
| `FEATURE_CLICKHOUSE_SEARCH`  | If `1`, use ClickHouse for transactionsByPactCode      | `1`                     |
| `FEATURE_CLICKHOUSE_INDEXER` | If `1`, attempt async writes to ClickHouse post-commit | `1`                     |

Outbox consumer tuning (optional):

| Variable                      | Description                                   | Default |
| ----------------------------- | --------------------------------------------- | ------- |
| `OUTBOX_CONSUMER_BATCH`       | Max rows processed per tick                   | `200`   |
| `OUTBOX_CONSUMER_INTERVAL_MS` | Polling interval in milliseconds              | `2000`  |
| `OUTBOX_CONSUMER_MAX_RETRIES` | Max retry attempts per outbox row before skip | `5`     |

Behavior:

- If ClickHouse is disabled or down, Postgres writes proceed; errors are logged only.
- A Postgres column `TransactionDetails.code_indexed` tracks whether code was indexed (default false).
- Health endpoint exposed at `/health/clickhouse` only when `CLICKHOUSE_URL` is set.

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

**Note**: Run each command in a separate terminal window -- with exception of `yarn migrate:up`, as they are long-running process.

```bash
# Run the database migrations
yarn migrate:up

# Start the streaming service
yarn dev:streaming

# Start the GraphQL server with hot reload
yarn dev:hot:graphql
```

### 5.2. Additional Commands

The following commands will aid in the maintenance of the indexer.

```bash
# Identifying Missing Blocks - Scan for and store any blocks that were missed in the streaming process.
yarn dev:missing

# Update GraphQL - Makers a hot reload (without building)
yarn dev:hot:graphql

# Generate GraphQL types - Generate the GraphQL types from the schema.
yarn graphql:generate-types
```

## 6. Running Tests

The Kadena Indexer project includes several types of tests to ensure the functionality and reliability of the codebase. Below are the instructions to run these tests:

You need to create a `.env.testing` on indexer folder using the `.template.env.testing` file as a guide.

### 6.1. Unit Tests

Unit tests are designed to test individual components or functions in isolation. To run the unit tests, use the following command:

```bash
yarn test:unit
```

This command will execute all the unit tests located in the `tests/unit` directory.

### 6.2. Integration Tests

Integration tests are used to test the queries and subscriptions of the GraphQL API. Run the integration tests separatedly because jest cannot handle using the same client for running queries and wss:

**Notice:** Queries and Subscriptions rely on a running postgres database with the same schema as the indexer with the full history synched correctly. Only run this test if you intend to host your own database.

```bash
yarn test:queries
yarn test:subscriptions
```

This command will execute the integration tests located in the `tests/integration` directory, using the environment variables specified in `.env`.

### 6.3. Specific Integration File Test

File tests are executed using the same environment as the integration tests. To run a specific integration test (eg. events), use the following command:

```bash
yarn test:file tests/integration/events.query.test.ts
```

### 6.4. Smoke Tests

Smoke tests are a subset of integration tests that verify the basic functionality of the application. To run the smoke tests, use the following command:

```bash
yarn test:smoke
```

This command will start the necessary services using Docker Compose, wait for a few seconds to ensure they are up and running, execute the smoke tests located in `tests/docker/smoke.test.ts`, and then shut down the services.

### 6.5. API Parity tests

These tests were created to make sure the hack-a-chain API is consistent with the Kadena API. It generates a random list of hashes, query data in both APIs and compare the responses. Use this command to run them:

```bash
yarn test:api-parity
```

The tests will generate folders in the path indexer/tests/integration/api-parity/logs, where each folder represents a query (e.g., 001_block). Inside each of these folders, there will be additional folders named after the block hash. Each block hash folder will contain three files:

- hackachain.json → Hackachain API response
- kadena.json → Kadena API response
- diffs.json → Differences between the two API responses
