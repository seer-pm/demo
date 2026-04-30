export const CURATE_STATUS = {
  None: "None",
  Absent: "Absent",
  Registered: "Registered",
  RegistrationRequested: "RegistrationRequested",
  ClearingRequested: "ClearingRequested",
} as const;

export type CurateStatus = (typeof CURATE_STATUS)[keyof typeof CURATE_STATUS];

export function isCurateStatus(value: unknown): value is CurateStatus {
  return typeof value === "string" && (Object.values(CURATE_STATUS) as readonly string[]).includes(value);
}
