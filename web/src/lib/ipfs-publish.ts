import deepEqual from "fast-deep-equal/es6";

type KlerosIpfsPostResult = {
  hash: string;
  path: string;
}[];

type GraphIpfsPostResult = { Name: string; Hash: string; Size: string }[];

/**
 * Send file to IPFS network.
 * @param {string} fileName - The name that will be used to store the file. This is useful to preserve extension type.
 * @param {ArrayBuffer} data - The raw data from the file to upload.
 * @returns {object} ipfs response. Should include the hash and path of the stored item.
 */
export default async function ipfsPublish(fileName: string, data: ArrayBuffer): Promise<KlerosIpfsPostResult> {
  const [klerosResult, theGraphResult] = await Promise.all([
    publishToKlerosNode(fileName, data),
    publishToTheGraphNode(fileName, data),
  ]);

  if (!deepEqual(klerosResult, theGraphResult)) {
    console.warn("IPFS upload result is different:", {
      kleros: klerosResult,
      theGraph: theGraphResult,
    });
    throw new Error("IPFS upload result is different.");
  }

  return klerosResult;
}

/**
 * Send file to IPFS network via the Kleros IPFS node
 * @param {string} fileName - The name that will be used to store the file. This is useful to preserve extension type.
 * @param {ArrayBuffer} data - The raw data from the file to upload.
 * @returns {object} ipfs response. Should include the hash and path of the stored item.
 */
async function publishToKlerosNode(fileName: string, data: ArrayBuffer): Promise<KlerosIpfsPostResult> {
  const buffer = Buffer.from(data);
  const url = "https://ipfs.kleros.io/add";

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      fileName,
      buffer,
    }),
    headers: {
      "content-type": "application/json",
    },
  });

  const body = await response.json();

  return body.data;
}

/**
 * Send file to IPFS network via The Graph hosted IPFS node
 * @param {string} fileName - The name that will be used to store the file. This is useful to preserve extension type.
 * @param {ArrayBuffer} data - The raw data from the file to upload.
 * @returns {object} ipfs response. Should include the hash and path of the stored item.
 */
async function publishToTheGraphNode(fileName: string, data: ArrayBuffer): Promise<KlerosIpfsPostResult> {
  const url = "https://api.thegraph.com/ipfs/api/v0/add?wrap-with-directory=true";

  const payload = new FormData();
  payload.append("file", new Blob([data]), fileName);

  const response = await fetch(url, {
    method: "POST",
    body: payload,
  });

  const result = (await jsonStreamToPromise(response.body!)) as GraphIpfsPostResult;

  return result.map(({ Name, Hash }) => ({
    hash: Hash,
    path: `/${Name}`,
  }));
}

/**
 * Accumulates a JSON stream body into an array of JSON objects.
 * @param {ReadableStream} stream The stream to read from.
 * @returns {Promise<any>} An array of all JSON objects emitted by the stream.
 */
async function jsonStreamToPromise(stream: ReadableStream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");

  return new Promise((resolve, reject) => {
    // biome-ignore lint/suspicious/noExplicitAny:
    const acc: any = [];
    const start = async () => {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) return resolve(acc);

          // Each `read` can produce one or more lines...
          const lines = decoder.decode(value).split(/\n/);
          const objects = lines.filter((line) => line.trim() !== "").map((line) => JSON.parse(line));
          acc.push(...objects);

          return start();
        })
        .catch((err) => reject(err));
    };

    start();
  });
}

export function getIpfsPublishPath(result: KlerosIpfsPostResult): string {
  return `/ipfs/${result[1].hash}${result[0].path}`;
}
