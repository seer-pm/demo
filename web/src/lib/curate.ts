import { ArbitratorAbi } from "@/abi/ArbitratorAbi";
import {
  readLightGeneralizedTcrArbitrator,
  readLightGeneralizedTcrArbitratorExtraData,
  readLightGeneralizedTcrSubmissionBaseDeposit,
} from "@/hooks/contracts/generated";
import { config } from "@/wagmi";
import { readContract } from "@wagmi/core";
import ipfsPublish, { getIpfsPublishPath } from "./ipfs-publish";

const CURATE_COLUMNS = [
  { label: "Market", description: "Address of the market", type: "address", isIdentifier: true },
  { label: "Images", description: "JSON file with the URLs of the images", type: "file", allowedFileTypes: "json" },
];

export async function getSubmissionDeposit() {
  const [arbitrator, arbitratorExtraData, submissionBaseDeposit] = await Promise.all([
    await readLightGeneralizedTcrArbitrator(config, {}),
    await readLightGeneralizedTcrArbitratorExtraData(config, {}),
    await readLightGeneralizedTcrSubmissionBaseDeposit(config, {}),
  ]);

  const arbitrationCost = await readContract(config, {
    address: arbitrator,
    abi: ArbitratorAbi,
    functionName: "arbitrationCost",
    args: [arbitratorExtraData],
  });

  return submissionBaseDeposit + arbitrationCost;
}

export async function getNewCurateItem(marketId: `0x${string}`, marketImage: File, outcomesImages: File[]) {
  const [marketImagePath, ...outcomesImagesPath] = await Promise.all(
    [marketImage].concat(outcomesImages).map(async (file, i) => {
      const extension = file.name.split(".").pop();
      const data = await new Response(new Blob([file])).arrayBuffer();
      return getIpfsPublishPath(await ipfsPublish(`seer_${marketId}_${i}.${extension}`, data));
    }),
  );

  const jsonImages = {
    market: marketImagePath,
    outcomes: outcomesImagesPath,
  };

  const values = {
    Market: marketId,
    Images: getIpfsPublishPath(await ipfsPublish("images.json", new TextEncoder().encode(JSON.stringify(jsonImages)))),
  };

  const encoder = new TextEncoder();
  const fileData = encoder.encode(JSON.stringify({ columns: CURATE_COLUMNS, values }));
  const ipfsEvidencePath = getIpfsPublishPath(await ipfsPublish("item.json", fileData));
  return ipfsEvidencePath;
}
