'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Blocks', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'The unique identifier for the block record.',
      },
      nonce: {
        type: Sequelize.STRING,
        comment: "The nonce of the block (e.g., '11598205990112090821').",
      },
      creationTime: {
        type: Sequelize.BIGINT,
        comment: 'The creation time of the block (e.g., 1718887955748100).',
      },
      parent: {
        type: Sequelize.STRING,
        comment: "The parent block hash (e.g., '2Zw0pONGUoyYmlKi-F0o_-ak2hKKlg1Mmc9ab6BjATY').",
      },
      adjacents: {
        type: Sequelize.JSONB,
        comment:
          "The adjacent blocks (e.g., {'1': 'Cgtf12fKCSm3X1E5Cwi83q4yOZ2zG1HRLhBaPCfTw_4', '15': 'SC9Lfee_7Ggl7B0QVOEtgZuU6hsabxqrF5MYyGvapSg', '17': 'Cc049gy1pCd2E-3NcqWFuQicOLh-uRbivSLXFYa9LtU'}).",
      },
      target: {
        type: Sequelize.STRING,
        comment: "The target of the block (e.g., 'o2YaicN3y58DkvsmCDKR88KqPwLPG5EADwAAAAAAAAA').",
      },
      payloadHash: {
        type: Sequelize.STRING,
        comment:
          "The payload hash of the block (e.g., 'cs5s_XSSro1mvtruns3LIRw5a-3mb6tui4PwrEIp8fI').",
      },
      chainId: {
        type: Sequelize.INTEGER,
        comment: 'The ID of the blockchain network (e.g., 16).',
      },
      weight: {
        type: Sequelize.STRING,
        comment: "The weight of the block (e.g., 'WNim1Xw26HgDNwEAAAAAAAAAAAAAAAAAAAAAAAAAAAA').",
      },
      height: {
        type: Sequelize.INTEGER,
        comment: 'The height of the block (e.g., 4881163).',
      },
      chainwebVersion: {
        type: Sequelize.STRING,
        comment: "The version of the chainweb protocol (e.g., 'mainnet01').",
      },
      epochStart: {
        type: Sequelize.BIGINT,
        comment: 'The epoch start time of the block (e.g., 1718886629458176).',
      },
      featureFlags: {
        type: Sequelize.BIGINT,
        comment: 'The feature flags of the block (e.g., 56646198189039183).',
      },
      hash: {
        type: Sequelize.STRING,
        comment: "The hash of the block (e.g., 'XZXKrN7DzWnzEX2oZp5HOjr6R0zapn-XxtsYOdtfYFY').",
      },
      minerData: {
        type: Sequelize.JSONB,
        comment:
          "The miner data of the block (e.g., {'account': 'k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3', 'predicate': 'keys-all', 'public-keys': ['e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3']}).",
      },
      transactionsHash: {
        type: Sequelize.STRING,
        comment:
          "The transactions hash of the block (e.g., '9yNSeh7rTW_j1ziKYyubdYUCefnO5K63d5RfPkHQXiM').",
      },
      outputsHash: {
        type: Sequelize.STRING,
        comment:
          "The outputs hash of the block (e.g., 'DwI3H4FgR5iC-AZ-f_BV8oYxH4yrz6ed-o5jvDAlVLE').",
      },
      coinbase: {
        type: Sequelize.JSONB,
        comment:
          "The coinbase data of the block (e.g., {'gas': 0, 'logs': 'xHwiHPh-CY_sc6xbTFuhXOWybRSzlJ_NVSGQTL4ady0', 'txId': 4457873, 'events': [{'name': 'TRANSFER', 'module': {'name': 'coin', 'namespace': null}, 'params': ['', 'k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3', 0.983026]}]}).",
      },
      canonical: {
        type: Sequelize.BOOLEAN,
        comment: 'Indicates whether the transaction is canonical.',
      },
      transactionsCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'The number of transactions in the block.',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('Blocks', ['chainwebVersion', 'chainId', 'hash'], {
      name: 'blocks_chainwebVersion_chainid_hash_unique_idx',
      unique: true,
    });
    await queryInterface.addIndex('Blocks', ['height'], {
      name: 'blocks_height_idx',
    });
    await queryInterface.addIndex('Blocks', ['hash'], {
      name: 'blocks_hash_idx',
    });
    await queryInterface.addIndex('Blocks', ['chainId', 'height'], {
      name: 'blocks_chainid_height_idx',
    });
    await queryInterface.addIndex('Blocks', ['chainId'], {
      name: 'blocks_chainid_idx',
    });
    await queryInterface.addIndex('Blocks', ['canonical'], {
      name: 'blocks_canonical_idx',
    });
    await queryInterface.addIndex('Blocks', ['height', 'id'], {
      name: 'blocks_height_id_idx',
    });
    await queryInterface.sequelize.query(
      'CREATE INDEX blocks_trgm_parent_idx ON "Blocks" USING gin (LOWER(parent) gin_trgm_ops);',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Blocks');
  },
};
