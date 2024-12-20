import { processPayloadKey } from "./payload";
import { getDecoded, getRequiredEnvString } from "../../utils/helpers";
import EventSource from "eventsource";
import { DispatchInfo } from "../../jobs/publisher-job";
import { uint64ToInt64 } from "../../utils/int-uint-64";
import Block, { BlockAttributes } from "../../models/block";
import { sequelize } from "../../config/database";

const SYNC_BASE_URL = getRequiredEnvString("SYNC_BASE_URL");
const SYNC_NETWORK = getRequiredEnvString("SYNC_NETWORK");

export async function startStreaming() {
  console.log("Starting streaming...");

  const blocksAlreadyReceived = new Set<string>();
  const blocksQueue: Array<any> = [];

  const eventSource = new EventSource(
    `${SYNC_BASE_URL}/${SYNC_NETWORK}/block/updates`,
  );

  eventSource.onerror = (error: any) => {
    console.error("Connection error:", error);
  };

  eventSource.addEventListener("BlockHeader", (event: any) => {
    try {
      const block = JSON.parse(event.data);
      const payload = processPayload(block.payloadWithOutputs);
      if (blocksAlreadyReceived.has(block.header.hash)) {
        return;
      }
      blocksAlreadyReceived.add(block.header.hash);
      blocksQueue.push({ header: block.header, payload });
    } catch (error) {
      console.log(error);
    }
  });

  setInterval(async () => {
    const blocksToProcess = [];
    while (blocksQueue.length > 0) {
      const b = blocksQueue.shift();
      blocksToProcess.push(b);
    }

    const promises = blocksToProcess.map(async (block: any) => {
      try {
        await saveBlock(block);
      } catch (error) {
        console.error("Error saving block:", error);
      }
    });

    await Promise.all(promises);
    console.log("Done processing blocks: ", blocksToProcess.length);
  }, 1000 * 10);

  setInterval(
    () => {
      console.log("Clearing blocks already received.");
      blocksAlreadyReceived.clear();
    },
    1000 * 60 * 5,
  );
}

function processPayload(payload: any) {
  const transactions = payload.transactions;
  transactions.forEach((transaction: any) => {
    transaction[0] = getDecoded(transaction[0]);
    transaction[1] = getDecoded(transaction[1]);
  });

  const minerData = getDecoded(payload.minerData);
  const transactionsHash = payload.transactionsHash;
  const outputsHash = payload.outputsHash;
  const coinbase = getDecoded(payload.coinbase);

  const payloadData = {
    transactions: transactions,
    minerData: minerData,
    transactionsHash: transactionsHash,
    outputsHash: outputsHash,
    payloadHash: payload.payloadHash,
    coinbase: coinbase,
  };

  return payloadData;
}

async function saveBlock(parsedData: any): Promise<DispatchInfo | null> {
  const headerData = parsedData.header;
  const payloadData = parsedData.payload;
  const transactions = payloadData.transactions || [];

  const tx = await sequelize.transaction();

  try {
    const blockAttribute = {
      nonce: headerData.nonce,
      creationTime: headerData.creationTime,
      parent: headerData.parent,
      adjacents: headerData.adjacents,
      target: headerData.target,
      payloadHash: headerData.payloadHash,
      chainId: headerData.chainId,
      weight: headerData.weight,
      height: headerData.height,
      chainwebVersion: headerData.chainwebVersion,
      epochStart: headerData.epochStart,
      featureFlags: uint64ToInt64(headerData.featureFlags),
      hash: headerData.hash,
      minerData: payloadData.minerData,
      transactionsHash: payloadData.transactionsHash,
      outputsHash: payloadData.outputsHash,
      coinbase: payloadData.coinbase,
      transactionsCount: transactions.length,
    } as BlockAttributes;

    const createdBlock = await Block.create(blockAttribute, {
      transaction: tx,
    });

    await processPayloadKey(createdBlock, payloadData, tx);

    const txs: Array<{
      requestKey: string;
      qualifiedEventNames: string[];
    }> = transactions.map((t: any) => {
      const qualifiedEventNames = t[1].events.map((e: any) => {
        const module = e.module.namespace
          ? `${e.module.namespace}.${e.module.name}`
          : e.module.name;
        const name = e.name;
        return `${module}.${name}`;
      });
      return {
        requestKey: t[1].reqKey,
        qualifiedEventNames,
      };
    });

    const events = transactions.flatMap((t: any) => t.qualifiedEventNames);
    const qualifiedEventNamesSet = new Set();
    const uniqueQualifiedEventNames = events.filter(
      (qualifiedEventName: any) => {
        const isDuplicate = qualifiedEventNamesSet.has(qualifiedEventName);
        qualifiedEventNamesSet.add(qualifiedEventName);
        return !isDuplicate;
      },
    );

    await tx.commit();
    return {
      hash: createdBlock.hash,
      chainId: createdBlock.chainId.toString(),
      height: createdBlock.height,
      requestKeys: txs.map((t) => t.requestKey),
      qualifiedEventNames: uniqueQualifiedEventNames,
    };
  } catch (error) {
    await tx.rollback();
    console.error(`Error saving block to the database: ${error}`);
    return null;
  }
}
