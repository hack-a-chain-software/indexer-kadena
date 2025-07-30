/**
 * Event Model Definition
 *
 * This module defines the Event model, which represents blockchain events emitted during transaction execution.
 * Events are critical for tracking state changes, transfers, and other significant actions that occur
 * during transaction processing in the Kadena blockchain.
 *
 * The model provides:
 * 1. Core event attributes and structure
 * 2. Database schema definition with indexes for efficient querying
 * 3. Relationship definitions to associated transactions
 *
 * Events serve as the primary mechanism for external systems to observe and react to
 * blockchain state changes without directly querying the blockchain.
 */

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '@/config/db-migrator';
import Transaction, { TransactionAttributes } from './transaction';

/**
 * Interface defining the attributes of an Event.
 * These attributes represent the fundamental properties of blockchain events
 * as they are stored in the database.
 */
export interface EventAttributes {
  /** Unique identifier for the event record */
  id: number;
  /** Reference to the transaction that emitted this event */
  transactionId: number;
  /** Chain ID where the event was emitted */
  chainId: number;
  /** Module that emitted the event (e.g., "coin") */
  module: string;
  /** Name of the event (e.g., "TRANSFER") */
  name: string;
  /** Parameters of the event as a JSON object */
  params: object;
  /** Qualified name of the module (with namespace if applicable) */
  qualname: string;
  /** Transaction request key associated with this event */
  requestkey: string;
  /** Order index of the event within its transaction */
  orderIndex: number;
}

/**
 * Represents an event emitted by a transaction in the blockchain.
 *
 * Events are emitted during transaction execution and provide information about
 * state changes, transfers, and other significant actions. They are critical for
 * tracking blockchain activity and enabling external systems to react to changes.
 */
class Event extends Model<EventAttributes> implements EventAttributes {
  /** The unique identifier for the event record (e.g., 5985644). */
  declare id: number;

  /** The ID of the associated transaction (e.g., 4134355). */
  declare transactionId: number;

  /** The ID of the blockchain network (e.g., 0). */
  declare chainId: number;

  /** The module associated with the event (e.g., "coin"). */
  declare module: string;

  /** The name of the event (e.g., "TRANSFER"). */
  declare name: string;

  /** The parameters of the event (e.g., ["k:ec48fcadd0649a4230800668ca5bb17d1a91f14daf87a56cb954964055994031", "k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3", 0.000969]). */
  declare params: object;

  /** The qualified name of the event (e.g., "coin"). */
  declare qualname: string;

  /** The request key of the event (e.g., "vyL1rMR_qbkoi8yUW3ktEeBU9XzdWSEaoe1GdPLL3j4"). */
  declare requestkey: string;

  /** The transaction that emitted this event. */
  declare transaction: Transaction;

  /** The order index of the event within its transaction. */
  declare orderIndex: number;
}

/**
 * Initialize the Event model with its attributes and configuration.
 * This defines the database schema for the Events table and sets up indexes
 * for efficient querying of event data.
 *
 * Events are typically queried by:
 * - Their associated transaction ID
 * - The module and name combination (e.g., to find all "coin.TRANSFER" events)
 *
 * TODO: [OPTIMIZATION] Consider adding additional indexes for common query patterns
 * such as by requestkey or chainId for better performance.
 */
Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'The unique identifier for the event record (e.g., 5985644).',
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'The ID of the associated transaction (e.g., 4134355).',
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'The ID of the blockchain network (e.g., 0).',
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "The module associated with the event (e.g., 'coin').",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "The name of the event (e.g., 'TRANSFER').",
    },
    params: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment:
        "The parameters of the event (e.g., ['k:ec48fcadd0649a4230800668ca5bb17d1a91f14daf87a56cb954964055994031', 'k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3', 0.000969]).",
    },
    qualname: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "The qualified name of the event (e.g., 'coin').",
    },
    requestkey: {
      type: DataTypes.STRING,
      allowNull: false,
      comment:
        "The request key of the event (e.g., 'vyL1rMR_qbkoi8yUW3ktEeBU9XzdWSEaoe1GdPLL3j4').",
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'The event order.',
    },
  },
  {
    sequelize,
    modelName: 'Event',
    indexes: [
      {
        name: 'events_transactionid_idx',
        fields: ['transactionId'],
      },
      {
        name: 'events_module_name_idx',
        fields: ['module', 'name'],
      },
    ],
  },
);

/**
 * Define relationship between Event and Transaction models.
 * Each event belongs to exactly one transaction.
 * This relationship enables querying events by their associated transactions,
 * and retrieving all events for a given transaction.
 */
Event.belongsTo(Transaction, {
  foreignKey: 'transactionId',
  as: 'transaction',
});

export default Event;
