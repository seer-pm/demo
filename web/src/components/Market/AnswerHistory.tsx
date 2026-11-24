import { DisplayName } from "@/components/DisplayName";
import Button from "@/components/Form/Button";
import { useModal } from "@/hooks/useModal";
import { usePublicUser } from "@/hooks/usePublicUser";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { formatDate } from "@/lib/date";
import { type RealityAnswerHistoryEntry, realityEvidencePath } from "@/lib/reality-evidence";
import { type Market, type Question, getRealityLink, getReportedAnswerText } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { formatEther } from "viem";

type HistoryResponse = {
  entries: RealityAnswerHistoryEntry[];
  evidenceUnavailable: boolean;
};

/** Keeps evidence as plain text and makes HTTP(S) source URLs clickable. */
function renderEvidence(text: string): ReactNode[] {
  const content: ReactNode[] = [];
  let offset = 0;

  for (const match of text.matchAll(/https?:\/\/[^\s<]+[^\s<.,;:!?"')\]]/gi)) {
    const [url] = match;
    const start = match.index ?? offset;
    content.push(
      text.slice(offset, start),
      <a key={start} href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>,
    );
    offset = start + url.length;
  }

  content.push(text.slice(offset));
  return content;
}

/** Displays the answerer's wallet identity using Seer's standard name fallback. */
function AnswerAuthor({ address }: { address: RealityAnswerHistoryEntry["user"] }) {
  const { data: user } = usePublicUser({ address });
  return <DisplayName address={address} username={user?.username} />;
}

/** Shows the selected Reality question's submissions and their evidence. */
function AnswerHistory({ market, question }: { market: Market; question: Question }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["realityAnswerHistory", market.chainId, question.id],
    staleTime: 0,
    queryFn: async ({ signal }): Promise<HistoryResponse> => {
      const response = await fetch(realityEvidencePath(market.chainId, question.id), { signal });
      if (!response.ok) throw new Error("Couldn’t load answer history.");
      return response.json();
    },
  });

  const entries = data?.entries ?? [];
  const chain = SUPPORTED_CHAINS[market.chainId];
  const explorer = chain?.blockExplorers?.default.url;

  return (
    <div className="space-y-4">
      {isPending && <output>Loading answer history…</output>}
      {!isPending && !isError && entries.length === 0 && <p>No answers yet.</p>}
      {data?.evidenceUnavailable && <p>Evidence is temporarily unavailable.</p>}
      {entries.length > 0 && (
        <ol className="divide-y divide-base-300">
          {entries.map((entry) => {
            const isArbitrationDecision = entry.bond === "0";
            const transactionLabel = isArbitrationDecision ? (
              "Arbitration decision"
            ) : (
              <AnswerAuthor address={entry.user} />
            );
            return (
              <li key={entry.id} className="space-y-2 py-3">
                <div className="font-semibold">
                  {entry.answer
                    ? getReportedAnswerText(entry.answer, market.outcomes, Number(market.templateId), "Unknown answer")
                    : "Unrevealed commitment"}
                </div>
                <div className="break-words text-sm">
                  {explorer ? (
                    <a
                      href={`${explorer}/tx/${entry.transactionHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-primary underline"
                      aria-label={isArbitrationDecision ? "View arbitration decision transaction" : undefined}
                    >
                      {transactionLabel}
                    </a>
                  ) : (
                    transactionLabel
                  )}
                  <div>
                    {formatDate(entry.timestamp)} UTC
                    {!isArbitrationDecision &&
                      ` · ${formatEther(BigInt(entry.bond))} ${chain?.nativeCurrency.symbol ?? ""}`}
                  </div>
                </div>
                {entry.evidence && (
                  <div className="space-y-1 rounded-lg bg-base-200 p-3">
                    <div className="font-semibold">Evidence</div>
                    <p className="whitespace-pre-wrap break-words [&_a]:text-purple-primary [&_a]:underline">
                      {renderEvidence(entry.evidence)}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {isError && (
        <div className="space-y-2">
          <p role="alert">Couldn’t load answer history.</p>
          <Button type="button" variant="secondary" text="Retry" size="small" onClick={() => void refetch()} />
        </div>
      )}
      <a
        href={getRealityLink(market.chainId, question.id)}
        target="_blank"
        rel="noreferrer"
        className="text-purple-primary underline"
      >
        View on Reality
      </a>
    </div>
  );
}

/** Opens answer history for this question when requested. */
export function AnswerHistoryButton({ market, question }: { market: Market; question: Question }) {
  const { Modal, openModal, closeModal } = useModal(`answer-history-${question.id}`, true);

  return (
    <>
      <button type="button" className="shrink-0 text-purple-primary underline" onClick={openModal}>
        Answer history
      </button>
      <Modal
        title="Answer history"
        content={
          <>
            <AnswerHistory market={market} question={question} />
            <div className="mt-6 text-center">
              <Button type="button" variant="secondary" text="Close" onClick={closeModal} />
            </div>
          </>
        }
      />
    </>
  );
}
