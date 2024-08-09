const KLEROS_IPFS_NETLIFY_FUNCTION_ENDPOINT = "https://kleros-api.netlify.app/.netlify/functions/upload-to-ipfs";

/**
 * Send file to IPFS network.
 * @param {string} fileName - The name that will be used to store the file. This is useful to preserve extension type.
 * @param {ArrayBuffer} data - The raw data from the file to upload.
 * @returns {string} - The path of the stored item.
 */
export default async function ipfsPublish(fileName: string, data: ArrayBuffer): Promise<string> {
  const payload = new FormData();
  payload.append("file", new Blob([data]), fileName);
  const operation = "file";
  const pinToGraph = "true";

  return new Promise((resolve, reject) => {
    fetch(`${KLEROS_IPFS_NETLIFY_FUNCTION_ENDPOINT}?operation=${operation}&pinToGraph=${pinToGraph}`, {
      method: "POST",
      body: payload,
    })
      .then((response) => response.json())
      .then((data) => resolve(data.cids[0]))
      .catch((err) => reject(err));
  });
}
