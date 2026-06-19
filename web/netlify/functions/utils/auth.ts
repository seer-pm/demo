import jwt from "jsonwebtoken";
import { type Address, getAddress, isAddress, isAddressEqual } from "viem";

export type DecodedToken = {
  sub: string;
  iat: number;
  iss: string;
};

export const verifyToken = (authHeader: string | undefined | null): string | null => {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded.sub.toLowerCase();
  } catch (error) {
    return null;
  }
};

const ADMIN_WALLETS: Address[] = (process.env.ADMIN_WALLET_ALLOWLIST ?? "")
  .split(",")
  .map((address) => address.trim())
  .filter((address) => isAddress(address))
  .map((address) => getAddress(address));

export function verifyAdminToken(authHeader: string | undefined | null): string | null {
  const wallet = verifyToken(authHeader);
  if (!wallet || !isAddress(wallet)) {
    return null;
  }

  const normalizedWallet = getAddress(wallet);
  const isAdmin = ADMIN_WALLETS.some((adminWallet) => isAddressEqual(adminWallet, normalizedWallet));

  return isAdmin ? wallet : null;
}
