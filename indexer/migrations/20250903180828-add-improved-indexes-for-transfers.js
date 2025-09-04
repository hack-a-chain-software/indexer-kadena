'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // For use case 1: where hasTokenId = ...
    await queryInterface.sequelize.query(
      'ALTER INDEX "transfers_hasTokenId_idx" RENAME TO "transfers_hasTokenId_count_idx";',
    );
    await queryInterface.addIndex('Transfers', ['hasTokenId', 'creationtime', 'id'], {
      name: 'transfers_hasTokenId_creationtime_id_idx',
    });

    // For use case 2: where modulename = ...
    await queryInterface.sequelize.query(
      'ALTER INDEX transfers_modulename_idx RENAME TO transfers_modulename_count_idx;',
    );
    await queryInterface.addIndex('Transfers', ['modulename', 'creationtime', 'id'], {
      name: 'transfers_modulename_creationtime_id_idx',
    });

    // For use case 3: where (from_acct = ... OR to_acct = ...) and hasTokenId = ...
    await queryInterface.addIndex('Transfers', ['from_acct', 'hasTokenId'], {
      name: 'transfers_from_acct_hasTokenId_count_idx',
    });
    await queryInterface.addIndex('Transfers', ['to_acct', 'hasTokenId'], {
      name: 'transfers_to_acct_hasTokenId_count_idx',
    });
    await queryInterface.addIndex('Transfers', ['from_acct', 'hasTokenId', 'creationtime', 'id'], {
      name: 'transfers_from_acct_hasTokenId_creationtime_id_idx',
    });
    await queryInterface.addIndex('Transfers', ['to_acct', 'hasTokenId', 'creationtime', 'id'], {
      name: 'transfers_to_acct_hasTokenId_creationtime_id_idx',
    });

    // -- For use case 4: where chainId = ... and hasTokenId = ...
    await queryInterface.addIndex('Transfers', ['chainId', 'hasTokenId'], {
      name: 'transfers_chainId_hasTokenId_idx',
    });
    await queryInterface.addIndex('Transfers', ['chainId', 'hasTokenId', 'creationtime', 'id'], {
      name: 'transfers_chainId_hasTokenId_creationtime_id_idx',
    });

    // -- For use case 5: where (from_acct = ... OR to_acct = ...) and hasTokenId = ... and chainId = ...
    await queryInterface.addIndex('Transfers', ['from_acct', 'hasTokenId', 'chainId'], {
      name: 'transfers_from_acct_hasTokenId_chainId_count_idx',
    });
    await queryInterface.addIndex('Transfers', ['to_acct', 'hasTokenId', 'chainId'], {
      name: 'transfers_to_acct_hasTokenId_chainId_count_idx',
    });
    await queryInterface.addIndex(
      'Transfers',
      ['from_acct', 'hasTokenId', 'chainId', 'creationtime', 'id'],
      {
        name: 'transfers_from_acct_hasTokenId_chainId_creationtime_id_idx',
      },
    );
    await queryInterface.addIndex(
      'Transfers',
      ['to_acct', 'hasTokenId', 'chainId', 'creationtime', 'id'],
      {
        name: 'transfers_to_acct_hasTokenId_chainId_creationtime_id_idx',
      },
    );

    // -- For use case 6: where (from_acct = ... OR to_acct = ...)  ... and modulename = ...
    await queryInterface.addIndex('Transfers', ['from_acct', 'modulename'], {
      name: 'transfers_from_acct_modulename_count_idx',
    });
    await queryInterface.addIndex('Transfers', ['to_acct', 'modulename'], {
      name: 'transfers_to_acct_modulename_count_idx',
    });
    await queryInterface.addIndex('Transfers', ['from_acct', 'modulename', 'creationtime', 'id'], {
      name: 'transfers_from_acct_modulename_creationtime_id_idx',
    });
    await queryInterface.addIndex('Transfers', ['to_acct', 'modulename', 'creationtime', 'id'], {
      name: 'transfers_to_acct_modulename_creationtime_id_idx',
    });

    // -- For use case 7: where (from_acct = ... OR to_acct = ...) ... and chainId = ... and modulename = ...
    await queryInterface.addIndex('Transfers', ['from_acct', 'chainId', 'modulename'], {
      name: 'transfers_from_acct_chainId_modulename_count_idx',
    });
    await queryInterface.addIndex('Transfers', ['to_acct', 'chainId', 'modulename'], {
      name: 'transfers_to_acct_chainId_modulename_count_idx',
    });
    await queryInterface.addIndex(
      'Transfers',
      ['from_acct', 'chainId', 'modulename', 'creationtime', 'id'],
      {
        name: 'transfers_from_acct_chainId_modulename_creationtime_id_idx',
      },
    );
    await queryInterface.addIndex(
      'Transfers',
      ['to_acct', 'chainId', 'modulename', 'creationtime', 'id'],
      {
        name: 'transfers_to_acct_chainId_modulename_creationtime_id_idx',
      },
    );
  },

  async down(queryInterface) {
    // For use case 1: where hasTokenId = ...
    await queryInterface.sequelize.query(
      'ALTER INDEX transfers_hasTokenId_count_idx RENAME TO transfers_hasTokenId_idx;',
    );
    await queryInterface.removeIndex('Transfers', 'transfers_hasTokenId_creationtime_id_idx');

    // For use case 2: where modulename = ...
    await queryInterface.sequelize.query(
      'ALTER INDEX transfers_modulename_count_idx RENAME TO transfers_modulename_idx;',
    );
    await queryInterface.removeIndex('Transfers', 'transfers_modulename_creationtime_id_idx');

    // For use case 3: where (from_acct = ... OR to_acct = ...) and hasTokenId = ...
    await queryInterface.removeIndex('Transfers', 'transfers_from_acct_hasTokenId_count_idx');
    await queryInterface.removeIndex('Transfers', 'transfers_to_acct_hasTokenId_count_idx');
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_from_acct_hasTokenId_creationtime_id_idx',
    );
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_to_acct_hasTokenId_creationtime_id_idx',
    );

    // For use case 4: where chainId = ... and hasTokenId = ...
    await queryInterface.removeIndex('Transfers', 'transfers_chainId_hasTokenId_idx');
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_chainId_hasTokenId_creationtime_id_idx',
    );

    // For use case 5: where (from_acct = ... OR to_acct = ...) and hasTokenId = ... and chainId = ...
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_from_acct_hasTokenId_chainId_count_idx',
    );
    await queryInterface.removeIndex('Transfers', 'transfers_to_acct_hasTokenId_chainId_count_idx');
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_from_acct_hasTokenId_chainId_creationtime_id_idx',
    );
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_to_acct_hasTokenId_chainId_creationtime_id_idx',
    );

    // For use case 6: where (from_acct = ... OR to_acct = ...) and modulename = ...
    await queryInterface.removeIndex('Transfers', 'transfers_from_acct_modulename_count_idx');
    await queryInterface.removeIndex('Transfers', 'transfers_to_acct_modulename_count_idx');
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_from_acct_modulename_creationtime_id_idx',
    );
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_to_acct_modulename_creationtime_id_idx',
    );

    // For use case 7: where (from_acct = ... OR to_acct = ...) and chainId = ... and modulename = ...
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_from_acct_chainId_modulename_count_idx',
    );
    await queryInterface.removeIndex('Transfers', 'transfers_to_acct_chainId_modulename_count_idx');
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_from_acct_chainId_modulename_creationtime_id_idx',
    );
    await queryInterface.removeIndex(
      'Transfers',
      'transfers_to_acct_chainId_modulename_creationtime_id_idx',
    );
  },
};
