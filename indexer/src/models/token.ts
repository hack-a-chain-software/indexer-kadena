import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../config/database';

export interface TokenInfoAttributes {
  decimalsToDisplay: number;
  description: string;
  discordUrl: string | null;
  mediumUrl: string | null;
  telegramUrl: string | null;
  themeColor: string;
  twitterUrl: string | null;
  websiteUrl: string | null;
}

export interface TokenAttributes {
  id: number;
  code: string;
  icon: string;
  tokenName: string;
  tokenSymbol: string;
  tokenInfo: TokenInfoAttributes;
  validated: boolean;
}

/**
 * Represents a token in the blockchain network.
 */
class Token extends Model<TokenAttributes> implements TokenAttributes {
  /** The unique identifier for the token record */
  declare id: number;

  /** The code/identifier of the token (e.g., "n_518dfea5f0d2abe95cbcd8956eb97f3238e274a9.AZUKI") */
  declare code: string;

  /** URL to the token's icon image */
  declare icon: string;

  /** The name of the token (e.g., "Azuki") */
  declare tokenName: string;

  /** The symbol of the token (e.g., "AZUKI") */
  declare tokenSymbol: string;

  /** Additional token information */
  declare tokenInfo: TokenInfoAttributes;

  /** Whether the token has been validated */
  declare validated: boolean;
}

Token.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'The unique identifier for the token record',
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment:
        'The code/identifier of the token (e.g., "n_518dfea5f0d2abe95cbcd8956eb97f3238e274a9.AZUKI")',
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "URL to the token's icon image",
    },
    tokenName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The name of the token (e.g., "Azuki")',
    },
    tokenSymbol: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The symbol of the token (e.g., "AZUKI")',
    },
    tokenInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Additional token information including decimals, description, and social links',
    },
    validated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the token has been validated',
    },
  },
  {
    sequelize,
    modelName: 'Token',
    indexes: [
      {
        name: 'tokens_code_idx',
        fields: ['code'],
        unique: true,
      },
      {
        name: 'tokens_symbol_idx',
        fields: ['tokenSymbol'],
      },
    ],
  },
);

export default Token;
