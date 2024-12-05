import React, { SVGAttributes } from "https://esm.sh/react@18.2.0";
import { formatOdds } from "../common.ts";
import { INVALID_RESULT_OUTCOME_TEXT } from "../constants.ts";
import { getMarketStatus } from "../getMarketStatus.ts";
import { CheckCircleIcon } from "../icons.tsx";
import { MarketTypes, getMarketType } from "../market.ts";
import { Market, MarketStatus } from "../types.ts";

type OutcomeWithOdds = {
  odd: number | null;
  i: number;
  isWinning?: boolean;
};

function OutcomesInfo({
  market,
  outcomesCount = 0,
  images = [],
  odds,
  winningOutcomes,
}: {
  market: Market;
  odds: (number | null)[];
  outcomesCount?: number;
  images?: string[];
  winningOutcomes: boolean[];
}) {
  const visibleOutcomesLimit = outcomesCount && outcomesCount > 0 ? outcomesCount : market.outcomes.length - 1;
  const marketStatus = getMarketStatus(market);
  const indexesOrderedByOdds = (() => {
    if (odds.length === 0) {
      return null;
    }

    const invalidIndex = market.outcomes.findIndex((outcome) => outcome === INVALID_RESULT_OUTCOME_TEXT);

    if (!winningOutcomes && marketStatus === MarketStatus.CLOSED) {
      const otherIndexes = odds
        .map((odd, i) => ({ odd, i }))
        .filter(({ i }) => i !== invalidIndex)
        .sort((a, b) => (b.odd ?? 0) - (a.odd ?? 0))
        .map((obj) => obj.i);

      return [invalidIndex, ...otherIndexes];
    }

    const winningIndexes: OutcomeWithOdds[] = [];
    const nonWinningIndexes: OutcomeWithOdds[] = [];

    odds.forEach((odd, i) => {
      if (winningOutcomes?.[i] === true) {
        winningIndexes.push({ odd, i });
      } else {
        nonWinningIndexes.push({ odd, i });
      }
    });

    const sortedWinning = winningIndexes.sort((a, b) => (b.odd ?? 0) - (a.odd ?? 0)).map((obj) => obj.i);
    const sortedNonWinning = nonWinningIndexes.sort((a, b) => (b.odd ?? 0) - (a.odd ?? 0)).map((obj) => obj.i);

    return [...sortedWinning, ...sortedNonWinning];
  })();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "100%",
      }}
    >
      {market.outcomes.map((_, j) => {
        const i = indexesOrderedByOdds ? indexesOrderedByOdds[j] : j;
        const outcome = market.outcomes[i];

        if (j >= visibleOutcomesLimit) {
          // render the first `visibleOutcomesLimit` outcomes
          return null;
        }
        if (
          outcome === INVALID_RESULT_OUTCOME_TEXT &&
          (marketStatus !== MarketStatus.CLOSED ||
            (marketStatus === MarketStatus.CLOSED && winningOutcomes[i] !== true))
        ) {
          return null;
        }
        return (
          <div
            key={`${outcome}_${i}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingLeft: "24px",
              paddingRight: "24px",
              paddingTop: "8px",
              paddingBottom: "8px",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", width: "65px" }}>
                <OutcomeImage image={images?.[i]} isInvalidResult={i === market.outcomes.length - 1} title={outcome} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                #{j + 1} {market.outcomes[i]}{" "}
                {i <= 1 &&
                  getMarketType(market) === MarketTypes.SCALAR &&
                  `[${Number(market.lowerBound)},${Number(market.upperBound)}]`}
                {winningOutcomes[i] === true && (
                  <div style={{ display: "flex", color: "#00C42B" }}>
                    <CheckCircleIcon />
                  </div>
                )}
              </div>
            </div>
            <p
              style={{
                fontSize: "24px",
                fontWeight: "600",
                margin: "0",
              }}
            >
              {odds?.[i] ? formatOdds(odds[i], getMarketType(market)) : null}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default OutcomesInfo;

function InvalidOutcomeImage({ width = 70, height = 83 }: SVGAttributes<SVGElement>) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        marginLeft: "auto",
        marginRight: "auto",
        background: "#e5e5e5",
      }}
    >
      <svg width={width} height={height} viewBox="0 0 70 83" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M48.936 64.967a3.525 3.525 0 0 0 1.038 3.378l3.827 3.554 3.742 3.475v1.61H6.198V6.016h31.87v13.328c0 2.156 1.776 3.89 3.984 3.89h15.492v42.49L54.8 63.175a3.546 3.546 0 0 0-3.45-.792l-5.298-4.92a19.331 19.331 0 0 0 5.294-13.314c0-10.727-8.72-19.426-19.476-19.426-10.755 0-19.476 8.699-19.476 19.426 0 10.727 8.72 19.425 19.476 19.425 4.31 0 8.294-1.396 11.52-3.761.025.026.05.051.078.076l5.468 5.078Zm14.804 6.51V21.382a7.663 7.663 0 0 0-2.34-5.495L47.473 2.286A8.065 8.065 0 0 0 41.846 0H7.968C3.568 0 0 3.485 0 7.781V75.22C0 79.515 3.569 83 7.968 83h47.805a8.018 8.018 0 0 0 6.48-3.253l1.793 1.665a3.548 3.548 0 0 0 5.041-.218 3.525 3.525 0 0 0-.215-4.952l-5.132-4.765ZM42.495 18.984V4.882l14.402 14.102H42.494ZM31.87 60.279c-8.93 0-16.172-7.224-16.172-16.13 0-8.906 7.243-16.13 16.172-16.13 8.93 0 16.172 7.224 16.172 16.13 0 8.906-7.242 16.13-16.172 16.13Zm7.539-22.987a.348.348 0 0 0-.348-.347l-2.87.013-4.32 5.138-4.317-5.134-2.874-.013a.346.346 0 0 0-.265.573l5.656 6.72-5.656 6.717a.348.348 0 0 0 .265.572l2.873-.012 4.317-5.139 4.317 5.134 2.87.013a.346.346 0 0 0 .265-.572l-5.647-6.717 5.656-6.72a.347.347 0 0 0 .078-.226Z"
          fill="#999"
        />
      </svg>
    </div>
  );
}

export function OutcomeImage({
  image,
  isInvalidResult,
  title,
}: {
  image: string | undefined;
  isInvalidResult: boolean;
  title: string;
}) {
  if (isInvalidResult) {
    return <InvalidOutcomeImage width="20" height="24" />;
  }

  if (image) {
    return (
      <img
        src={image}
        alt={title}
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        marginLeft: "auto",
        marginRight: "auto",
        background: "#9747FF",
      }}
    ></div>
  );
}
