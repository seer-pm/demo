export const REALITY_TEMPLATE_SINGLE_SELECT = 2;

function encodeOutcomes(outcomes: string[]) {
  return JSON.stringify(outcomes).replace(/^\[/, "").replace(/\]$/, "");
}

export function encodeQuestionText(
  qtype: "bool" | "single-select" | "multiple-select" | "uint" | "datetime",
  txt: string,
  outcomes: string[],
  category: string,
  lang?: string,
) {
  let qText = JSON.stringify(txt).replace(/^"|"$/g, "");
  const delim = "\u241f";

  if (qtype === "single-select" || qtype === "multiple-select") {
    qText = qText + delim + encodeOutcomes(outcomes);
  }
  qText = qText + delim + category + delim + (lang || "en_US");
  return qText;
}
