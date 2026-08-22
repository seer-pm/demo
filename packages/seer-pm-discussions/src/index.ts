import { createDiscussionsClient, userFromAddress } from "./client/createDiscussionsClient";
import Discussion from "./components/Discussion/Discussion";
import DiscussionsProvider from "./components/DiscussionsProvider/DiscussionsProvider";
import Post from "./components/Post/Post";
import Postbox from "./components/Postbox/Postbox";
import Tooltip from "./components/Tooltip/Tooltip";
import { UserPfp, Username } from "./components/User/User";
import { SD_ROOT_CLASS } from "./constants";
import { useDiscussions } from "./hooks/useDiscussions";

export type {
  Comment,
  DiscussionUser,
  DiscussionMarket,
  DiscussionPosition,
  DiscussionsClient,
  CreateCommentInput,
  DiscussionButtonProps,
  DiscussionConnectButtonProps,
  DiscussionUserPositionBadgeProps,
  DiscussionComponents,
} from "./types";
export type { TooltipProps } from "./components/Tooltip/Tooltip";

export {
  Discussion,
  DiscussionsProvider,
  Post,
  Postbox,
  Tooltip,
  UserPfp,
  Username,
  useDiscussions,
  createDiscussionsClient,
  userFromAddress,
  SD_ROOT_CLASS,
};
