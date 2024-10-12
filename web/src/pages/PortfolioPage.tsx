import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import Input from "@/components/Form/Input";
import PortfolioTable from "@/components/Portfolio/PortfolioTable";
import useCalculatePositionsValue from "@/hooks/portfolio/useCalculatePositionsValue";

import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { ArrowDropDown, ArrowDropUp, SearchIcon, Union } from "@/lib/icons";
import { useState } from "react";
import { useAccount } from "wagmi";

function PortfolioPage() {
  const { chainId = DEFAULT_CHAIN, address } = useAccount();

  const [filterMarketName, setFilterMarketName] = useState("");
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setFilterMarketName((event.target as HTMLInputElement).value);
  };

  const { isCalculating, isGettingPositions, delta, positions, currentPortfolioValue, deltaPercent } =
    useCalculatePositionsValue();

  const filteredPositions = positions?.filter((position) =>
    position.marketName.toLowerCase().includes(filterMarketName.toLowerCase()),
  );

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
      <div className="mt-8 bg-white border border-black-medium rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] h-[162px] pl-6 pt-[38px] flex gap-4">
        <div className="bg-purple-primary w-16 h-16 rounded-full flex items-center justify-center">
          <Union />
        </div>
        <div>
          <p className="text-[16px] text-black-secondary">Total</p>
          {isCalculating ? (
            <div className="mt-3 shimmer-container h-[48px] w-[300px]" />
          ) : (
            <p className="text-[32px] text-[#333333] font-semibold">
              {Number(currentPortfolioValue ?? 0n).toFixed(2)} sDAI
            </p>
          )}
          {!isCalculating &&
            (delta >= 0 ? (
              <p className="text-[#00C42B] flex gap-2">
                <span>
                  <ArrowDropUp fill="#00C42B" />
                </span>
                {delta.toFixed(2)} sDAI ({deltaPercent.toFixed(2)}%) today
              </p>
            ) : (
              <p className="text-[#c40000] flex gap-2">
                <span>
                  <ArrowDropDown fill="#c40000" />
                </span>
                {delta.toFixed(2)} sDAI ({deltaPercent.toFixed(2)}%) today
              </p>
            ))}
        </div>
      </div>

      {isGettingPositions && <div className="shimmer-container w-full h-[200px]" />}

      {!isGettingPositions && !positions?.length && <Alert type="warning">No positions found.</Alert>}
      {!!filteredPositions?.length && (
        <>
          <div className="grow">
            <Input
              placeholder="Search by Market Name"
              className="w-full"
              icon={<SearchIcon />}
              onKeyUp={marketNameCallback}
            />
          </div>
          <div className="w-full overflow-x-auto">
            <PortfolioTable chainId={chainId as SupportedChain} data={filteredPositions} />
          </div>
        </>
      )}
    </div>
  );
}

export default PortfolioPage;
