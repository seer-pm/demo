import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { SD_ROOT_CLASS } from "../../constants";
import { CommentsContext } from "../../contexts/DiscussionsContext";
import { useDiscussions } from "../../hooks/useDiscussions";
import { EmptyStateComments } from "../../icons";
import type { Comment, DiscussionComponents, DiscussionUser, DiscussionsClient } from "../../types";
import DiscussionsProvider from "../DiscussionsProvider/DiscussionsProvider";
import LoadingCircle from "../LoadingCircle/LoadingCircle";
import Post from "../Post/Post";
import Postbox from "../Postbox/Postbox";
import "../../styles/tokens.css";

export type DiscussionProps = {
  context: string;
  client: DiscussionsClient;
  user?: DiscussionUser | null;
  onRequestConnect?: () => Promise<void>;
  components?: DiscussionComponents;
  characterLimit?: number | null;
  className?: string;
  style?: CSSProperties;
};

export default function Discussion({
  context,
  client,
  user = null,
  onRequestConnect,
  components,
  characterLimit = null,
  className,
  style,
}: DiscussionProps) {
  return (
    <DiscussionsProvider
      context={context}
      client={client}
      user={user}
      onRequestConnect={onRequestConnect}
      components={components}
    >
      <CommentsContent characterLimit={characterLimit} className={className} style={style} />
    </DiscussionsProvider>
  );
}

function CommentsContent({
  characterLimit,
  className,
  style,
}: {
  characterLimit: number | null;
  className?: string;
  style?: CSSProperties;
}) {
  const { client, context, components } = useDiscussions();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadGenRef = useRef(0);
  const Button = components.Button;

  useEffect(() => {
    void loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, client]);

  async function loadComments() {
    if (!client) return;
    const gen = ++loadGenRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await client.listComments();
      if (gen !== loadGenRef.current) return;
      setComments((prev) => {
        const serverIds = new Set(data.map((c) => c.id));
        const localOnly = prev.filter((c) => !serverIds.has(c.id));
        return localOnly.length === 0 ? data : [...localOnly, ...data];
      });
    } catch (error) {
      if (gen !== loadGenRef.current) return;
      console.error("Failed to load comments:", error);
      setLoadError("Couldn't load comments. Check your connection and try again.");
    } finally {
      if (gen === loadGenRef.current) setLoading(false);
    }
  }

  // Single surface: padding only (composer owns the bordered control; no outer card)
  const rootClass = [SD_ROOT_CLASS, "w-full bg-sd-bg-main", className].filter(Boolean).join(" ");

  return (
    <CommentsContext.Provider value={{ comments, setComments }}>
      <div className={rootClass} style={style}>
        <div className="p-6">
          <Postbox />
        </div>

        <div className="@container space-y-7 border-t border-x-0 border-b-0 border-solid border-sd-border-secondary p-6">
          {loading ? (
            <output
              className="flex w-full justify-center p-8 text-sd-color-main"
              aria-busy="true"
              aria-label="Loading comments"
            >
              <LoadingCircle />
            </output>
          ) : loadError ? (
            <div className="flex w-full flex-col items-center gap-3 py-4 text-center">
              <p role="alert" className="m-0 text-[15px] text-sd-color-danger">
                {loadError}
              </p>
              <Button variant="secondary" type="button" onClick={() => void loadComments()}>
                Retry
              </Button>
            </div>
          ) : comments.length <= 0 ? (
            <div className="flex w-full flex-col items-center gap-2 py-2">
              <p className="m-0 text-center text-[15px] font-medium text-sd-color-main">
                No takes yet. Share the first one.
              </p>
              <EmptyStateComments />
            </div>
          ) : (
            <LoopComments comments={comments} characterLimit={characterLimit} />
          )}
        </div>
      </div>
    </CommentsContext.Provider>
  );
}

function isTopLevel(comment: Comment) {
  return !comment.parentId;
}

function LoopComments({ comments, characterLimit }: { comments: Comment[]; characterLimit: number | null }) {
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const comment of comments) {
      if (!comment.parentId) continue;
      const siblings = map.get(comment.parentId);
      if (siblings) siblings.push(comment);
      else map.set(comment.parentId, [comment]);
    }
    return map;
  }, [comments]);

  return (
    <>
      {comments.map((comment) =>
        isTopLevel(comment) ? (
          <CommentNode
            key={comment.id}
            childrenByParent={childrenByParent}
            comment={comment}
            characterLimit={characterLimit}
          />
        ) : null,
      )}
    </>
  );
}

function CommentNode({
  childrenByParent,
  comment,
  characterLimit,
}: {
  childrenByParent: Map<string, Comment[]>;
  comment: Comment;
  characterLimit: number | null;
}) {
  const children = childrenByParent.get(comment.id) ?? [];

  return (
    <div className="relative">
      {comment.parentId != null && (
        <span
          className="absolute -ml-px bottom-5 left-[22px] top-12 w-px rounded-md bg-sd-border-main"
          aria-hidden="true"
        />
      )}
      <Post post={comment} characterLimit={characterLimit} />
      <div className="ml-10 mt-7 max-[600px]:ml-6">
        {children.map((child) => (
          <CommentNode
            key={child.id}
            childrenByParent={childrenByParent}
            comment={child}
            characterLimit={characterLimit}
          />
        ))}
      </div>
    </div>
  );
}
