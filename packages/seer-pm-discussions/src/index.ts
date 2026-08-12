import { createDiscussionsClient, userFromAddress } from "./client/createDiscussionsClient";
import Discussion from "./components/Discussion/Discussion";
import DiscussionsProvider from "./components/DiscussionsProvider/DiscussionsProvider";
import { EnsIcon } from "./components/EnsIcon/EnsIcon";
import Post from "./components/Post/Post";
import Postbox from "./components/Postbox/Postbox";
import { CopyableAddress, UserPfp, Username } from "./components/User/User";
import { SD_ROOT_CLASS } from "./constants";
import { useDiscussions } from "./hooks/useDiscussions";

export type {
  Comment,
  DiscussionUser,
  DiscussionsClient,
  CreateCommentInput,
  DiscussionButtonProps,
  DiscussionConnectButtonProps,
  DiscussionUserPositionBadgeProps,
  DiscussionComponents,
} from "./types";

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
  createDiscussionsClient,
  userFromAddress,
  SD_ROOT_CLASS,
};
