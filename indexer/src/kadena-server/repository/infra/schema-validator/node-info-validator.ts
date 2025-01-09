import zod from "zod";
import { GetNodeInfo } from "../../application/network-repository";
import { getRequiredEnvString } from "../../../../utils/helpers";

const schema = zod.object({
  nodeApiVersion: zod.string(),
  nodeBlockDelay: zod.number(),
  nodeVersion: zod.string(),
  nodeChains: zod.array(zod.string()),
  nodeNumberOfChains: zod.number(),
  nodeGenesisHeights: zod.array(zod.tuple([zod.string(), zod.number()])),
  nodePackageVersion: zod.string(),
  // nodeServiceDate: zod.string(),
  nodeLatestBehaviorHeight: zod.number(),
  nodeGraphHistory: zod.any(),
  nodeHistoricalChains: zod.any(),
});

const HOST_URL = getRequiredEnvString("NODE_API_URL");

function validate(row: any): GetNodeInfo {
  console.log(row);
  const res = schema.parse(row);
  return {
    apiVersion: res.nodeApiVersion,
    networkHost: HOST_URL,
    networkId: res.nodeVersion,
    nodeBlockDelay: res.nodeBlockDelay,
    nodeChains: res.nodeChains,
    numberOfChains: res.nodeNumberOfChains,
    genesisHeights: res.nodeGenesisHeights.map(([chainId, height]) => ({
      chainId,
      height,
    })),
    nodePackageVersion: res.nodePackageVersion,
    nodeServiceDate: new Date(),
    nodeLatestBehaviorHeight: res.nodeLatestBehaviorHeight,
  };
}

export const nodeInfoValidator = { validate };
