import { CURATE_SUBGRAPH_URLS, lightGeneralizedTcrAddress } from "./constants.ts";
import { Status, VerificationResult } from "./types.ts";

export async function fetchVerificationStatusList(chainId: string) {
  const registryAddress = lightGeneralizedTcrAddress[chainId];
  if (!registryAddress) return {};
  const query = `{
    litems(first: 1000, where: {registryAddress: "${registryAddress}"}) {
      itemID
      status
      registryAddress
      metadata {
        props {
          value
          description
          label
        }
      }
      data
      latestRequester
      disputed
      requests{
        requestType
        resolved
      }
    }
  }`;
  const results = await fetch(CURATE_SUBGRAPH_URLS[chainId]!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });
  const json = await results.json();

  const litems = json?.data?.litems;
  return litems.reduce(
    (obj, item) => {
      const marketId = item.metadata?.props?.find((prop) => prop.label === "Market")?.value?.toLowerCase();
      if (!marketId) {
        return obj;
      }
      const isVerifiedBeforeClearing =
        item.status === Status.ClearingRequested &&
        item.requests.find((request) => request.requestType === Status.RegistrationRequested)?.resolved;
      if (item.status === Status.Registered || isVerifiedBeforeClearing) {
        obj[marketId] = { status: "verified", itemID: item.itemID };
        return obj;
      }
      if (item.status === Status.RegistrationRequested) {
        if (item.disputed) {
          obj[marketId] = { status: "challenged", itemID: item.itemID };
        } else {
          obj[marketId] = { status: "verifying", itemID: item.itemID };
        }
        return obj;
      }
      obj[marketId] = { status: "not_verified" };
      return obj;
    },
    {} as { [key: string]: VerificationResult },
  );
}
