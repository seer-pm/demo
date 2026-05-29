export interface CsvOutcome {
  value: string;
  token: string;
}

export function parseCSV(text: string, existingOutcomes: { value: string; token: string }[] = []): CsvOutcome[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("CSV file must have a header row and at least one data row.");
  }

  const headers = parseLine(lines[0]).map((h) => h.trim());

  const outcomeIndex = headers.findIndex((h) => h.toLowerCase() === "outcome");
  if (outcomeIndex === -1) {
    throw new Error('CSV must have an "outcome" column.');
  }

  const tokenIndex = headers.findIndex((h) => h === "token name");

  const results: CsvOutcome[] = [];
  const seenOutcomes = new Set<string>(existingOutcomes.map((o) => o.value.trim().toLowerCase()));
  const seenTokens = new Set<string>(existingOutcomes.filter((o) => o.token).map((o) => o.token.trim().toUpperCase()));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseLine(line);
    const value = values[outcomeIndex]?.trim();
    if (!value) continue;

    let token = "";
    if (tokenIndex >= 0) {
      token = (values[tokenIndex]?.trim() || "").toUpperCase();
    }

    if (token.length > 11) {
      throw new Error(`Token name "${token}" exceeds 11 characters.`);
    }

    // Check for duplicate outcome name (case insensitive) — within CSV and against existing
    const valueLower = value.toLowerCase();
    if (seenOutcomes.has(valueLower)) {
      throw new Error(`Duplicate outcome "${value}".`);
    }
    seenOutcomes.add(valueLower);

    // Check for duplicate token name (case insensitive) — within CSV and against existing
    if (token) {
      const tokenUpper = token.toUpperCase();
      if (seenTokens.has(tokenUpper)) {
        throw new Error(`Duplicate token name "${token}".`);
      }
      seenTokens.add(tokenUpper);
    }

    results.push({ value, token });
  }

  if (results.length === 0) {
    throw new Error("No valid outcome rows found in CSV.");
  }

  return results;
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}
