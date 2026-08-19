import type { ComponentType, ReactNode } from "react";

export type DiscussionUser = {
  address: string;
  /** Seer username resolved by the host API. */
  username: string;
  /** Host-owned route to this user's profile. */
  profileHref?: string | null;
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
};

export type DiscussionComponents = {
  Button?: ComponentType<DiscussionButtonProps>;
  ConnectButton?: ComponentType<DiscussionConnectButtonProps>;
  UserPositionBadge?: ComponentType<DiscussionUserPositionBadgeProps>;
};

export type ResolvedDiscussionComponents = {
  Button: ComponentType<DiscussionButtonProps>;
  ConnectButton?: ComponentType<DiscussionConnectButtonProps>;
  UserPositionBadge?: ComponentType<DiscussionUserPositionBadgeProps>;
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
  createComment: (input: CreateCommentInput) => Promise<{ id: string }>;
  editComment: (id: string, body: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  setLike: (id: string, liked: boolean) => Promise<void>;
};
