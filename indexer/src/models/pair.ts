import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../config/database';
import PoolChartData from './pool-chart-data';
import PoolStats from './pool-stats';
import PoolTransaction from './pool-transaction';
import Token from './token';

export interface PairAttributes {
  id: number;
  lastPrice: number;
  token0Id: number;
  token1Id: number;
  token0Liquidity: number;
  token0LiquidityDollar: number;
  token1Liquidity: number;
  token1LiquidityDollar: number;
  totalLiquidityDollar: number;
  feePercentage: number;
}

/**
 * Represents a trading pair in the blockchain network.
 */
class Pair extends Model<PairAttributes> implements PairAttributes {
  /** The unique identifier for the pair record */
  declare id: number;

  /** The last price of the pair */
  declare lastPrice: number;

  /** The ID of the first token in the pair */
  declare token0Id: number;

  /** The ID of the second token in the pair */
  declare token1Id: number;

  /** The liquidity of the first token in the pair */
  declare token0Liquidity: number;

  /** The liquidity of the first token in dollars */
  declare token0LiquidityDollar: number;

  /** The liquidity of the second token in the pair */
  declare token1Liquidity: number;

  /** The liquidity of the second token in dollars */
  declare token1LiquidityDollar: number;

  /** The total liquidity of the pair in dollars */
  declare totalLiquidityDollar: number;

  /** The fee percentage for the pair (e.g., 0.3 for 0.3%) */
  declare feePercentage: number;

  /** The first token in the pair */
  declare token0: Token;

  /** The second token in the pair */
  declare token1: Token;

  /** The pool statistics for this pair */
  declare poolStats: PoolStats[];

  /** The pool transactions for this pair */
  declare poolTransactions: PoolTransaction[];

  /** The pool chart data for this pair */
  declare poolChartData: PoolChartData[];
}

Pair.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'The unique identifier for the pair record',
    },
    lastPrice: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: 'The last price of the pair',
    },
    token0Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'The ID of the first token in the pair',
    },
    token1Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'The ID of the second token in the pair',
    },
    token0Liquidity: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: 'The liquidity of the first token in the pair',
    },
    token0LiquidityDollar: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: 'The liquidity of the first token in dollars',
    },
    token1Liquidity: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: 'The liquidity of the second token in the pair',
    },
    token1LiquidityDollar: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: 'The liquidity of the second token in dollars',
    },
    totalLiquidityDollar: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: 'The total liquidity of the pair in dollars',
    },
    feePercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.3,
      comment: 'The fee percentage for the pair (e.g., 0.3 for 0.3%)',
    },
  },
  {
    sequelize,
    modelName: 'Pair',
    indexes: [
      {
        name: 'pairs_token0_token1_idx',
        fields: ['token0Id', 'token1Id'],
        unique: true,
      },
    ],
  },
);

// Define associations
Pair.belongsTo(Token, {
  foreignKey: 'token0Id',
  as: 'token0',
});

Pair.belongsTo(Token, {
  foreignKey: 'token1Id',
  as: 'token1',
});

Pair.hasMany(PoolStats, {
  foreignKey: 'pairId',
  as: 'poolStats',
});

Pair.hasMany(PoolTransaction, {
  foreignKey: 'pairId',
  as: 'poolTransactions',
});

Pair.hasMany(PoolChartData, {
  foreignKey: 'pairId',
  as: 'poolChartData',
});

export default Pair;
