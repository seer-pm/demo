import type { AdminCreditCard } from "@/hooks/admin/useAdminCreditCampaigns";
import { downloadCsv } from "@/lib/utils";

function fileSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "campaign"
  );
}

/** `serial,url` for the printer. Anyone holding this file can claim every card in it. */
export function downloadCardsCsv(campaignName: string, cards: AdminCreditCard[]) {
  downloadCsv(
    [
      { key: "serial", title: "serial" },
      { key: "url", title: "url" },
    ],
    cards.map((card) => ({ serial: card.serial, url: card.url })),
    `${fileSlug(campaignName)}-cards.csv`,
  );
}

/** One `<serial>.svg` QR per card plus `cards.csv` mapping each serial to its URL and file. */
export async function downloadCardsQrZip(campaignName: string, cards: AdminCreditCard[]) {
  // Loaded on demand: only admins exporting a campaign need them.
  const [{ default: QRCode }, { strToU8, zipSync }] = await Promise.all([import("qrcode"), import("fflate")]);

  const files: Record<string, Uint8Array> = {};
  const csvRows = ["serial,url,filename"];
  for (const card of cards) {
    const filename = `${card.serial}.svg`;
    const svg = await QRCode.toString(card.url, { type: "svg", errorCorrectionLevel: "M", margin: 2 });
    files[filename] = strToU8(svg);
    csvRows.push(`${card.serial},${card.url},${filename}`);
  }
  files["cards.csv"] = strToU8(csvRows.join("\n"));

  const zipped = zipSync(files, { level: 6 });
  const blob = new Blob([zipped], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileSlug(campaignName)}-qr-codes.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
