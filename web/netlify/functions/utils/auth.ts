import jwt from "jsonwebtoken";

export type DecodedToken = {
  sub: string;
  iat: number;
  iss: string;
};

export const verifyToken = (authHeader: string | undefined): string | null => {
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
