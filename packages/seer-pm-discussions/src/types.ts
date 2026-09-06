import type { ComponentType, ReactNode } from "react";

export type DiscussionUser = {
  address: string;
};

/** Market fields used by Seer's discussion and holder APIs. */
export type DiscussionMarket = {
  id: string;
  chainId: number;
  outcomes: readonly string[];
  wrappedTokens: readonly string[];
};

export type DiscussionPosition = {
  tokenId: string;
  outcome: string;
  balance: bigint;
};

export type DiscussionButtonProps = {
  children?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
};

export type DiscussionConnectButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
};

export type DiscussionUserPositionBadgeProps = {
  user: DiscussionUser;
  positions: readonly DiscussionPosition[];
};

export type DiscussionComponents = {
  Button?: ComponentType<DiscussionButtonProps>;
  ConnectButton?: ComponentType<DiscussionConnectButtonProps>;
  UserPositionBadge?: ComponentType<DiscussionUserPositionBadgeProps>;
};

export type ResolvedDiscussionComponents = {
  Button: ComponentType<DiscussionButtonProps>;
  ConnectButton?: ComponentType<DiscussionConnectButtonProps>;
  UserPositionBadge: ComponentType<DiscussionUserPositionBadgeProps>;
};

export type Comment = {
  id: string;
  author: string;
  authorDetails: DiscussionUser;
  body: string;
  parentId: string | null;
  createdAt: number;
  likeCount: number;
  likedByMe?: boolean;
};

export type CreateCommentInput = {
  body: string;
  parentId?: string | null;
};

export type DiscussionsClient = {
  marketId: string;
  listComments: () => Promise<Comment[]>;
  listCommenterPositions: (account?: string) => Promise<Map<string, DiscussionPosition[]>>;
  createComment: (input: CreateCommentInput) => Promise<{ id: string }>;
  editComment: (id: string, body: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  setLike: (id: string, liked: boolean) => Promise<void>;
};
