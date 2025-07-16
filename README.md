# Kadindexer - Kadena Indexer

[![Build](https://github.com/hack-a-chain-software/indexer-kadena/actions/workflows/indexer.yml/badge.svg)](https://github.com/hack-a-chain-software/indexer-kadena/actions/workflows/indexer.yml)
[![Lint](https://github.com/hack-a-chain-software/indexer-kadena/actions/workflows/lint.yml/badge.svg)](https://github.com/hack-a-chain-software/indexer-kadena/actions/workflows/lint.yml)

- [`@kadena-indexer/indexer`](indexer/README.md): The indexer package, which is responsible for scanning and storing blocks for Kadena blockchain.
- [`@kadena-indexer/backfill`](backfill/README.md): The backfill package, which is responsible for backfilling the indexer data.

## Requirements

- Install dependencies.
- See individual package READMEs for specific prerequisites.

## Installation

Install dependencies with the following command:

```bash
yarn install
```

## Quick Start

This is the quickest way to get the indexer running.

Install [Docker](https://www.docker.com/).

Fill the `.env` file in the `indexer` folder. See [Environment Variables Reference](../indexer/README.md#32-environment-variables-reference).

```bash
cp indexer/.env.template indexer/.env
```

To start all services:

```bash
yarn indexer dev
```

**NOTE:** Using the Postgres image with the composer requires the database `DB_USERNAME` defaulting to `postgres`.
