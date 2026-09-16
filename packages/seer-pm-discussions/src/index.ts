import { createDiscussionsClient, userFromAddress } from "./client/createDiscussionsClient";
import Discussion from "./components/Discussion/Discussion";
import DiscussionsProvider from "./components/DiscussionsProvider/DiscussionsProvider";
import { EnsIcon } from "./components/EnsIcon/EnsIcon";
import Post from "./components/Post/Post";
import Postbox from "./components/Postbox/Postbox";
import { CopyableAddress, UserPfp, Username } from "./components/User/User";
import { SD_ROOT_CLASS } from "./constants";
import { useDiscussions } from "./hooks/useDiscussions";
import { useDisplayName } from "./hooks/useDisplayName";
import { addressUsername } from "./utils/addressUsername";
import { resolveDisplayName } from "./utils/displayName";

export type {
  Comment,
  DiscussionUser,
  DiscussionPosition,
  DiscussionsClient,
  CreateCommentInput,
  DiscussionButtonProps,
  DiscussionConnectButtonProps,
  DiscussionUserPositionBadgeProps,
  DiscussionComponents,
} from "./types";

export type { DisplayNameSource, ResolvedDisplayName } from "./utils/displayName";
export type { UseDisplayNameResult } from "./hooks/useDisplayName";

export {
  Discussion,
  DiscussionsProvider,
  CopyableAddress,
  EnsIcon,
  Post,
  Postbox,
  UserPfp,
  Username,
  useDiscussions,
  useDisplayName,
  resolveDisplayName,
  addressUsername,
  createDiscussionsClient,
  userFromAddress,
  SD_ROOT_CLASS,
};
