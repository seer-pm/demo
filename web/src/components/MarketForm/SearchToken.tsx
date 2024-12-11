import { SupportedChain } from "@/lib/chains";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import { Address } from "viem";
import { Alert } from "../Alert";
import Button from "../Form/Button";

export interface TokenListItem {
  chainId: number;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

interface TokenListResult {
  tokens: TokenListItem[];
}

const useTokenList = () => {
  return useQuery<TokenListItem[], Error>({
    queryKey: ["useTokenList"],
    queryFn: async () => {
      const result = await fetch("https://t2crtokens.eth.link/");
      return (((await result.json()) as TokenListResult).tokens || []).sort((a, b) =>
        a.name.toLocaleLowerCase() > b.name.toLocaleLowerCase() ? 1 : -1,
      );
    },
  });
};

function useSearchTokens(search: string, chainId: SupportedChain) {
  const { data: tokens = [] } = useTokenList();

  return useMemo(() => {
    return tokens.filter((token) => {
      if (token.chainId !== chainId) {
        return false;
      }
      return (
        token.symbol.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
        token.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
        token.address.toLocaleLowerCase() === search.toLocaleLowerCase()
      );
    });
  }, [search]);
}

function TokenLogo({ token }: { token: TokenListItem }) {
  const src = `https://cdn.kleros.link/ipfs/${token.logoURI.substring(7)}`;
  return <img src={src} className="h-[20px] w-[20px]" alt={token.name} />;
}

export function SearchToken({
  closeModal,
  selectToken,
  chainId,
}: { closeModal: () => void; selectToken: (token: TokenListItem) => void; chainId: SupportedChain }) {
  const parentRef = useRef(null);
  const [search, setSearch] = useState("");
  const tokens = useSearchTokens(search, chainId);

  const onChange = (evt: React.FormEvent<HTMLInputElement>) => {
    setSearch(evt.currentTarget.value);
  };

  const rowVirtualizer = useVirtualizer({
    count: tokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Search symbol or address"
          className="input input-bordered w-full"
          onChange={onChange}
        />
      </div>

      <div ref={parentRef} className="h-[300px] overflow-auto my-2">
        {tokens.length === 0 && <Alert type="warning">No tokens found.</Alert>}
        <div
          style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative", fontSize: 14 }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.index + tokens[virtualItem.index].address}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 32,
                paddingTop: 4,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div
                className="flex space-x-2 cursor-pointer border-b border-b-black-medium h-full"
                key={tokens[virtualItem.index].address}
                onClick={() => {
                  selectToken(tokens[virtualItem.index]);
                  closeModal();
                }}
              >
                <TokenLogo token={tokens[virtualItem.index]} />{" "}
                <div>
                  {tokens[virtualItem.index].name} ({tokens[virtualItem.index].symbol})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Button text="Close" onClick={closeModal} />
      </div>
    </div>
  );
}
