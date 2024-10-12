import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { Spinner } from "@/components/Spinner";
import { useMarket } from "@/hooks/useMarket";
import { useMarketImages } from "@/hooks/useMarketImages";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { EtherscanIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { getRealityLink } from "@/lib/reality";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Address, isAddress } from "viem";
import { useAccount } from "wagmi";

interface VerificationCheckFormValues {
  address: Address | "";
}

function MarketCheck({ id, chainId }: { id: Address; chainId: SupportedChain }) {
  const { data: market, isError: isMarketError, isPending: isMarketPending } = useMarket(id as Address, chainId);

  const { data: images } = useMarketImages(id, chainId, false);
  const { data: tokens } = useTokensInfo(market?.wrappedTokens || []);

  if (isMarketError) {
    return (
      <div className="py-10 px-10">
        <Alert type="error" className="mb-5">
          Market not found
        </Alert>
      </div>
    );
  }

  if (isMarketPending || !market) {
    return (
      <div className="py-10 px-10">
        <Spinner />
      </div>
    );
  }

  const blockExplorerUrl = SUPPORTED_CHAINS[chainId].blockExplorers?.default?.url;

  return (
    <div className="container-fluid w-[924px] py-[65px] text-center space-y-[24px]">
      <div>
        <div className="text-[24px] font-semibold mb-[16px]">Market Name</div>
        <div>{market.marketName}</div>
      </div>

      <div>
        <div className="text-[24px] font-semibold mb-[16px]">Reality Questions</div>
        <div>
          {market.questions.map((question) => (
            <div key={question.id}>
              <a
                href={getRealityLink(chainId, question.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-primary"
              >
                {question.id}
              </a>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[24px] font-semibold mb-[16px]">Condition Id</div>
        <div>{market.conditionId}</div>
      </div>

      <div>
        <div className="text-[24px] font-semibold mb-[16px]">Parent Collection Id</div>
        <div>{market.parentCollectionId}</div>
      </div>

      <div>
        <div className="text-[24px] font-semibold mb-[16px]">Outcomes</div>
        <div>
          {market.outcomes.map((outcome, i) => (
            <div key={i}>{outcome}</div>
          ))}
        </div>
      </div>

      {tokens && (
        <div>
          <div className="text-[24px] font-semibold mb-[16px]">Tokens</div>
          <div>
            {tokens.map((token, i) => (
              <div className="flex items-center justify-center space-x-2" key={i}>
                <span>{token.name}</span>{" "}
                <a
                  href={blockExplorerUrl && `${blockExplorerUrl}/address/${market.wrappedTokens[i]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-primary"
                >
                  <EtherscanIcon width="16" height="16" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {images && (
        <>
          <div>
            <div className="text-[24px] font-semibold mb-[16px]">Market Images</div>
            <div>
              <img src={images.market} style={{ maxWidth: 100, margin: "0 auto" }} alt="Market" />
            </div>
          </div>

          <div>
            <div className="text-[24px] font-semibold mb-[16px]">Outcomes Images</div>
            <div className="space-y-[16px]">
              {images.outcomes.map((image, i) => (
                <div key={i}>
                  <img src={image} style={{ maxWidth: 100, margin: "0 auto" }} alt="Outcome" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VerificationCheckPage() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id as Address;
  const { chain } = useAccount();

  const useFormReturn = useForm<VerificationCheckFormValues>({
    mode: "all",
    defaultValues: {
      address: "",
    },
  });

  if (isAddress(id)) {
    return <MarketCheck id={id} chainId={Number(params.chainId) as SupportedChain} />;
  }

  const onSubmit = async (values: VerificationCheckFormValues) => {
    navigate(paths.verificationCheck(values.address, chain!.id));
  };

  return (
    <div className="container-fluid w-[924px] py-[65px] text-center">
      {!chain && <Alert type="warning">Connect your wallet to a supported network.</Alert>}

      {chain && (
        <form onSubmit={useFormReturn.handleSubmit(onSubmit)}>
          <div>
            <div className="text-[24px] font-semibold mb-[32px]">Market address</div>
            <Input
              autoComplete="off"
              {...useFormReturn.register("address", {
                required: "This field is required.",
                validate: (v) => {
                  if (!isAddress(v)) {
                    return "Invalid address.";
                  }

                  return true;
                },
              })}
              className="w-full"
              useFormReturn={useFormReturn}
            />
          </div>

          <div className="space-x-[24px]">
            <Button type="submit" text="Submit" />
          </div>
        </form>
      )}
    </div>
  );
}

export default VerificationCheckPage;
