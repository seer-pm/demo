import { Alert } from "@/components/Alert";
import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import { useMergePositions } from "@/hooks/useMergePositions";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useTokenBalances } from "@/hooks/useTokenBalance";
import { fetchWrappedAddresses } from "@/hooks/useWrappedAddresses";
import { SupportedChain } from "@/lib/chains";
import { generateBasicPartition } from "@/lib/conditional-tokens";
import { CHAIN_ROUTERS, COLLATERAL_TOKENS } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { displayBalance } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { type Address, hexToNumber, zeroAddress } from "viem";
import { useAccount } from "wagmi";

/*
select topic1 as conditionId from gnosis.logs 
-- keccak256("ConditionPreparation(bytes32,address,bytes32,uint256)")
where topic0 = 0xab3760c3bd2bb38b5bcf54dc79802ed67338b4cf29f3054ded67ed24661e4177 
and tx_hash IN (
select tx_hash from gnosis.logs 
-- keccak256("NewMarket(address,string,string[],uint256,uint256,bytes32,bytes32,bytes32[],uint256,string[])")
where topic0 = 0xaadcf1e7d57b927db65a77362bc2db82150d8fa843662b079edb722342b08692 
-- keccak256("NewMarket(address)")
or topic0 = 0x6cbab6250b188d6d9b0b6c7b0246bd61d23de28520080c27e417bf27e4c47b3d
)
*/

const CONDITION_IDS_AND_OUTCOME_SLOT_COUNTS: [`0x${string}`, `0x${string}`][] = [
  [
    "0xd3c1c8744ecba93ec3a56144403d49d53624c9dee645ea37ee61a3073cab2d26",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x5aa767523f69b772d740a26b421b2224897f108f4296640bae13e654d342c9f3",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x8bc007203e5d77bb2958de10d927e06a5589683268f75b107dd89e44680d693e",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x6b6abc4b682951aebf034aeb39b3723c01484239d092636777d73a3d0d72f8b1",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x9ea84a5fcc4cf94c4b042b9ae54c71680070094ba962c845ccc07b2ef217bc96",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0xaed2475ac57606c567b2fec501ff60d7ac2577c8711b8b2af672613a5bd7c047",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0xe55f1f95e9abe902f80537026bd890708f7bd91536079cf3aeb6102a268293d7",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x8251fba4bab1803d4e7bc9336fc7875fea661f7c8f3f6c4039e8562efb4c3c59",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x3ee16c1363703b5a18e404bec3077802b85b7fa12b1f469969ce5fd6575b6955",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x5146a96056a15a664f0c5cbe4030950860b4ad1265cb97573facf3c316609573",
    "0x0000000000000000000000000000000000000000000000000000000000000008",
  ],
  [
    "0xea8700ff236afc2a9ec1b4098c6c7069cfff56ba6e0aa780d9b7286989ba4e21",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x0c6a878c3f6c9a3313c290867a01b9045b4a9cc800d3e1b05d02395930741610",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x0625f59f331790cda067d29487cc306f2625e79493ade6dd86e827fbdb707d02",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x74f5a2727cd4ace01cb9ef8c773fa54121d8ca5ea5b98cc8b91761c1c7eb6fcd",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x66b1d1f56cdfee4ab541dbe996538920a8983e383661836f52e5e4eff0c9baad",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0xc9111d47d1b3999e9d194a88db554a8b5e471b36f1d5d260b033889fbae8fd2b",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0xb0227319d4445706376b6fdc54af0308f1394ff464ad844f0f4c11c8c414db59",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x9e8efa5cead8a09c11dde475b81d49a34ed88579b43333d5029af1c814829926",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0xf374eea3d826ba926b5fca5b454779276259672b8ec06bbdd2d79057b6f4fe43",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x887bff51906f2a79dad504bc3a16ac8de97ecb5593909e8890e69767657e1fad",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0xd5ca5aa91a3ff4a40e411a9b66025e9606f97b929502b45c45a84285cd6f1710",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x08e0f1db185ac0a6e2a4ee225df3687649707bd24b7705678dae89cba63c6e41",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x75eacab18cdeeed073ecf5b52fffaf3984811ff86a0be8819628e02e81c8622a",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0xfc9b0d1ce8fea3906b844f6162936e479c112df76dad8a16fbc2a628c98196bc",
    "0x0000000000000000000000000000000000000000000000000000000000000004",
  ],
  [
    "0x3ffa8f46289ac01024ed3e4cc0f71395de520c363ac74b73bd8fca025c6d788f",
    "0x0000000000000000000000000000000000000000000000000000000000000007",
  ],
  [
    "0xaf372353f4c6a6ec4175b9a8f2f2f9e933c4e3caeb41b45537fdf1a3188359bd",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0xb1fb0ea0c4d1bc7629e306145167d566dbb2c0d2a560274e887e9b46d38a68f6",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x8bf6ed770066716e2ea46e5cb313b00286568f63ff8013adfd7fbb01efacfed2",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x80d82acf4366e1bb70a183a3f0c5090404ca9407f5ac367df999428b51d3e0d4",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x2bf2758ee9eb21aae6feb0be4d032e5381890750b58f67b7b2d0956d33a165f1",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0xf15f1be3a3eb68b58ec5fdbb1d14040a66d27f1b697e5e114fb8b2fd19fe1e02",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0x5edb0afb2313154744275e4d6b7462e6a95cc599d2d4229acc1b63ee48242767",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0x298361cde624d2977dd83307e8d1e19f2a0fd5f8242046eaad4e5ba48b79f684",
    "0x0000000000000000000000000000000000000000000000000000000000000004",
  ],
  [
    "0x181efab21d93c4577ba2aea9c620452249280d3f3e2606122729ab351eb196f7",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0xf8a642c81aff4acbec764b2e08dc52b5324b85bfe234e2644ff576e3d5e54a7e",
    "0x0000000000000000000000000000000000000000000000000000000000000005",
  ],
  [
    "0x1d1848f8136eb4c4d8b293008df99ff1aadf78c00a39ab2620f1129171c9eacc",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0xe79622aef437737cb435ca6a8e7233c359755deed5b5e9c2944656f02d6e6805",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0x22a187a0649cfaaddcfb2abfd1e9049bdc9eabf6b1975ae60dd5596bc55413ce",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0x94cf5ba008aa29acad8447573642b351582bc23bd176cfb849e62753d1a971c1",
    "0x0000000000000000000000000000000000000000000000000000000000000004",
  ],
  [
    "0x18b0948f32054e2ba4db5185f3e980a7bce64272a050c972c63e43c89a83833e",
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  ],
  [
    "0x41281bbab018c8617e4c105d86ffa0e9dbc9043a76f213c166ee714b5fa98027",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0xa60d77278bd6672ae15941511894411455079c67629c776dc8738b2152851887",
    "0x0000000000000000000000000000000000000000000000000000000000000005",
  ],
  [
    "0xa99f6a34edc994bc09f40bab37b1edafd73c1d650448493194c0cef9ac1a624c",
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  ],
  [
    "0xdff6e272a0496534d8ddd881a777221287713d692f51a071efbb2bc62dd6e134",
    "0x0000000000000000000000000000000000000000000000000000000000000005",
  ],
];

const ROUTER_ADDRESSES: Address[] = [
  "0x204a20a508925601de0E0eE6B1114176052f8Be7",
  "0xb89733665e63ecc1256E0729a9D950eF949450b8",
  "0x8046A07bBcfD564dE263837024F82D3bd977FA79",
  "0x1cc00aaCd2Ff107a4936B99474BB31bD9FD75B61",
];

export const useWrappedAddressesV2 = (
  chainId: number,
  conditionId?: `0x${string}`,
  outcomeSlotCountOrIndexSet?: number | bigint[],
) => {
  const partition: bigint[] =
    typeof outcomeSlotCountOrIndexSet === "number"
      ? generateBasicPartition(outcomeSlotCountOrIndexSet)
      : outcomeSlotCountOrIndexSet || [];
  return useQuery<{ router: Address; addresses: Address[] } | undefined, Error>({
    enabled: !!chainId && !!conditionId && partition.length > 0,
    queryKey: ["useWrappedAddressesV2", chainId, conditionId, partition.map((i) => i.toString())],
    queryFn: async () => {
      const data = await Promise.all(
        ROUTER_ADDRESSES.map((routerAddress) => fetchWrappedAddresses(chainId, routerAddress, conditionId!, partition)),
      );

      for (const i in data) {
        if (data[i][0] !== zeroAddress) {
          return {
            router: ROUTER_ADDRESSES[i],
            addresses: data[i],
          };
        }
      }

      return {
        router: ROUTER_ADDRESSES[0],
        addresses: data[0],
      };
    },
  });
};

function MergePage() {
  const { address: account, chainId } = useAccount();

  if (!account || !chainId) {
    return (
      <div className="container py-10">
        <Alert type="error" className="mb-5">
          Connect your account
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-10">
      <div className="space-y-5">
        {CONDITION_IDS_AND_OUTCOME_SLOT_COUNTS.map((d) => (
          <MergeCondition
            account={account}
            conditionId={d[0]}
            outcomeSlotCount={hexToNumber(d[1])}
            chainId={chainId as SupportedChain}
          />
        ))}
      </div>
    </div>
  );
}

function MergeCondition({
  account,
  conditionId,
  outcomeSlotCount,
  chainId,
}: { account: Address; conditionId: `0x${string}`; outcomeSlotCount: number; chainId: SupportedChain }) {
  const { data: wrappedAddresses } = useWrappedAddressesV2(chainId, conditionId, outcomeSlotCount);
  const { data: balances = [] } = useTokenBalances(account, wrappedAddresses?.addresses || []);

  const mergePositions = useMergePositions((/*receipt: TransactionReceipt*/) => {
    queryClient.invalidateQueries({ queryKey: ["useWrappedAddressesV2"] });
  });

  const maxPositionAmount = balances.reduce((acum, curr) => {
    if (acum === 0n || curr < acum) {
      // biome-ignore lint/style/noParameterAssign:
      acum = curr;
    }
    return acum;
  }, BigInt(0));

  const { data: missingApprovals } = useMissingApprovals(
    wrappedAddresses?.addresses || [],
    account,
    wrappedAddresses?.router || zeroAddress,
    maxPositionAmount,
  );

  if (balances.length === 0) {
    return null;
  }

  const canMerge = balances.every((b) => b > 0n);

  if (!canMerge) {
    return null;
  }

  if (mergePositions.isError) {
    return (
      <div className="container py-10">
        <Alert type="error" className="mb-5">
          Error mergin positions
        </Alert>
      </div>
    );
  }

  const onClick = async (/*values: MergeFormValues*/) => {
    await mergePositions.mutateAsync({
      router: wrappedAddresses?.router!,
      conditionId,
      collateralToken: COLLATERAL_TOKENS[chainId].primary.address,
      outcomeSlotCount,
      amount: maxPositionAmount,
      isMainCollateral: true,
      routerType: CHAIN_ROUTERS[chainId!],
    });
  };

  return (
    <div>
      <div>Balance: {displayBalance(maxPositionAmount, 18)} sDAI</div>

      {missingApprovals && (
        <div>
          {missingApprovals.length === 0 && (
            <Button
              variant="primary"
              type="button"
              onClick={onClick}
              disabled={mergePositions.isPending}
              isLoading={mergePositions.isPending}
              text="Merge"
            />
          )}
          {missingApprovals.length > 0 && (
            <div className="space-y-[8px]">
              {missingApprovals.map((approval) => (
                <ApproveButton
                  key={approval.address}
                  tokenAddress={approval.address}
                  tokenName={approval.name}
                  spender={approval.spender}
                  amount={maxPositionAmount}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MergePage;
