import { createContext } from "react";
import DefaultButton from "../components/DefaultButton";
import type { Comment, DiscussionUser, DiscussionsClient, ResolvedDiscussionComponents } from "../types";

export type DiscussionsContextValue = {
  client: DiscussionsClient | null;
  user: DiscussionUser | null;
  setUser: ((user: DiscussionUser | null) => void) | null;
  connecting: boolean;
  setConnecting: ((v: boolean) => void) | null;
  onRequestConnect: (() => Promise<void>) | null;
  components: ResolvedDiscussionComponents;
};

export const DiscussionsContext = createContext<DiscussionsContextValue>({
  client: null,
  user: null,
  setUser: null,
  connecting: false,
  setConnecting: null,
  onRequestConnect: null,
  components: { Button: DefaultButton },
});

export type CommentsContextValue = {
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
};

export const CommentsContext = createContext<CommentsContextValue>({
  comments: [],
  setComments: () => undefined,
});
