import ipfsPublish from "./ipfs-publish";

const CURATE_COLUMNS = [
  { label: "Market", description: "Address of the market", type: "address", isIdentifier: true },
  { label: "Images", description: "JSON file with the URLs of the images", type: "file", allowedFileTypes: "json" },
];

export async function getNewCurateItem(marketId: `0x${string}`, marketImage: File, outcomesImages: File[]) {
  const [marketImagePath, ...outcomesImagesPath] = await Promise.all(
    [marketImage].concat(outcomesImages).map(async (file, i) => {
      const extension = file.name.split(".").pop();
      const data = await new Response(new Blob([file])).arrayBuffer();
      return await ipfsPublish(`seer_${marketId}_${i}.${extension}`, data);
    }),
  );

  const jsonImages = {
    market: marketImagePath,
    outcomes: outcomesImagesPath,
  };

  const values = {
    Market: marketId,
    Images: await ipfsPublish("images.json", new TextEncoder().encode(JSON.stringify(jsonImages))),
  };

  const encoder = new TextEncoder();
  const fileData = encoder.encode(JSON.stringify({ columns: CURATE_COLUMNS, values }));
  return await ipfsPublish("item.json", fileData);
}
