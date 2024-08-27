import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import Input from "@/components/Form/Input";
import PortfolioTable from "@/components/Portfolio/PortfolioTable";
import { Spinner } from "@/components/Spinner";
import { usePositions } from "@/hooks/usePortfolioPositions";
import { useCurrentTokensPrices, useHistoryTokensPrices } from "@/hooks/useSwaprTokenPriceInPool";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { ArrowDropDown, ArrowDropUp, SearchIcon, Union } from "@/lib/icons";
import { subDays } from "date-fns";
import { useMemo, useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";

function PortfolioPage() {
  const { chainId = DEFAULT_CHAIN, address } = useAccount();
  const { data: positions, isPending } = usePositions(address as Address, chainId as SupportedChain);
  const { data: tokenIdToTokenCurrentPrice, isPending: isPendingCurrentPrices } = useCurrentTokensPrices(
    positions?.map((position) => position.tokenId),
    chainId as SupportedChain,
  );
  const yesterdayInSeconds = useMemo(() => Math.floor(subDays(new Date(), 1).getTime() / 1000), []);
  const { data: tokenIdToTokenHistoryPrice, isPending: isPendingHistoryPrices } = useHistoryTokensPrices(
    positions?.map((position) => position.tokenId),
    chainId as SupportedChain,
    yesterdayInSeconds,
  );
  const [filterMarketName, setFilterMarketName] = useState("");
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setFilterMarketName((event.target as HTMLInputElement).value);
  };
  const currentPortfolioValue = (positions ?? []).reduce((acc, curr) => {
    const tokenPrice = tokenIdToTokenCurrentPrice?.[curr.tokenId.toLocaleLowerCase()] ?? 0;
    const tokenValue = tokenPrice * curr.tokenBalance;
    return acc + tokenValue;
  }, 0);
  const historyPortfolioValue = (positions ?? []).reduce((acc, curr) => {
    const tokenPrice =
      tokenIdToTokenHistoryPrice?.[curr.tokenId.toLocaleLowerCase()] ??
      tokenIdToTokenCurrentPrice?.[curr.tokenId.toLocaleLowerCase()] ??
      0;
    const tokenValue = tokenPrice * curr.tokenBalance;
    return acc + tokenValue;
  }, 0);
  const delta = currentPortfolioValue - historyPortfolioValue;
  const positionsWithTokenValue = positions
    ?.map((position) => {
      const tokenPrice = tokenIdToTokenCurrentPrice?.[position.tokenId.toLocaleLowerCase()];
      return {
        ...position,
        tokenPrice,
        tokenValue: tokenPrice ? tokenPrice * position.tokenBalance : undefined,
      };
    })
    ?.filter((position) => position.marketName.toLowerCase().includes(filterMarketName.toLowerCase()));

  if (!address) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px]">
        <Alert type="warning" title="Account not found">
          Connect your wallet to see your portfolio.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <Breadcrumb links={[{ title: "Portfolio" }]} />
      <div className="mt-8 bg-white border border-[#E5E5E5] rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] h-[162px] pl-6 pt-[38px] flex gap-4">
        <div className="bg-[#9747FF] w-16 h-16 rounded-full flex items-center justify-center">
          <Union />
        </div>
        <div>
          <p className="text-[16px] text-[#999999]">Total</p>
          {isPendingCurrentPrices || isPendingHistoryPrices ? (
            <div className="mt-3">
              <Spinner />
            </div>
          ) : (
            <p className="text-[32px] text-[#333333] font-semibold">
              {Number(currentPortfolioValue ?? 0n).toFixed(2)} sDAI
            </p>
          )}
          {delta > 0 ? (
            <p className="text-[#00C42B] flex gap-2">
              <span>
                <ArrowDropUp fill="#00C42B" />
              </span>
              {delta.toFixed(2)} sDAI ({((delta / currentPortfolioValue) * 100).toFixed(2)}%) today
            </p>
          ) : (
            <p className="text-[#c40000] flex gap-2">
              <span>
                <ArrowDropDown fill="#c40000" />
              </span>
              {delta.toFixed(2)} sDAI ({((delta / currentPortfolioValue) * 100).toFixed(2)}%) today
            </p>
          )}
        </div>
      </div>
      <div className="text-[16px] text-[#333333] font-semibold">Positions</div>
      {isPending && (
        <div>
          <Spinner />
        </div>
      )}

      {!isPending && !positions?.length && <Alert type="warning">No positions found.</Alert>}
      {!!positionsWithTokenValue?.length && (
        <>
          <div className="grow">
            <Input placeholder="Search" className="w-full" icon={<SearchIcon />} onKeyUp={marketNameCallback} />
          </div>
          <PortfolioTable chainId={chainId as SupportedChain} data={positionsWithTokenValue} />
        </>
      )}
    </div>
  );
}

export default PortfolioPage;
