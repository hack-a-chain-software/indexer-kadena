import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database";
import Transaction from "./transaction";

export interface EventAttributes {
  id: number;
  transactionId: number;
  payloadHash: string;
  chainId: number;
  module: string;
  modulehash: string;
  name: string;
  params: object;
  paramtext: object;
  qualname: string;
  requestkey: string;
}

class Event extends Model<EventAttributes> implements EventAttributes {
  declare id: number;
  declare transactionId: number;
  declare payloadHash: string;
  declare chainId: number;
  declare module: string;
  declare modulehash: string;
  declare name: string;
  declare params: object;
  declare paramtext: object;
  declare qualname: string;
  declare requestkey: string;
}

Event.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    transactionId: { type: DataTypes.INTEGER, allowNull: true },
    payloadHash: { type: DataTypes.STRING, allowNull: false },
    chainId: { type: DataTypes.INTEGER, allowNull: false },
    module: { type: DataTypes.STRING, allowNull: false },
    modulehash: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    params: { type: DataTypes.JSONB, allowNull: false },
    paramtext: { type: DataTypes.JSONB, allowNull: false },
    qualname: { type: DataTypes.STRING, allowNull: false },
    requestkey: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: "Event",
  }
);

Event.belongsTo(Transaction, {
  foreignKey: "transactionId",
  as: "transaction",
});

export default Event;
