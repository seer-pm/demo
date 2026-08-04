import { useEffect, useRef, useState } from "react";
import { useDiscussions } from "../../hooks/useDiscussions";
import useOutsideClick from "../../hooks/useOutsideClick";
import { LikeIcon, MenuHorizontal, ReplyIcon } from "../../icons";
import type { Comment } from "../../types";
import { renderPlainTextWithLinks } from "../../utils/linkify";
import Postbox from "../Postbox/Postbox";
import TimeAgo from "../TimeAgo/TimeAgo";
import { UserPfp, Username } from "../User/User";
import "../../styles/postContent.css";

type PostProps = {
  post: Comment;
  showPfp?: boolean;
  showCta?: boolean;
  characterLimit?: number | null;
};

const actionButton =
  "inline-flex min-h-11 items-center gap-1 rounded-md border border-transparent bg-transparent px-2 py-2 text-[13px] font-medium cursor-pointer text-sd-color-secondary disabled:opacity-60 disabled:cursor-not-allowed";
const actionButtonActive = "text-sd-color-active";

const UNDO_MS = 5000;

export default function Post({ post, showPfp = true, showCta = true, characterLimit = null }: PostProps) {
  const { user, client, onRequestConnect, components } = useDiscussions();
  const Button = components.Button;
  const [editPost, setEditPost] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [reply, setReply] = useState<Comment | null>(null);
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [postMenuVis, setPostMenuVis] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [body, setBody] = useState(post.body);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  async function like(nextLiked: boolean) {
    if (!client) return;
    if (!user) {
      setLoading(true);
      try {
        await onRequestConnect?.();
      } finally {
        setLoading(false);
      }
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;
    setLiked(nextLiked);
    setLikeCount((count) => Math.max(0, nextLiked ? count + 1 : count - 1));
    setActionError(null);

    try {
      await client.setLike(post.id, nextLiked);
    } catch (error) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      console.error("Failed to update like:", error);
      setActionError("Couldn't update like. Try again.");
    }
  }

  function scheduleDelete() {
    if (!client || pendingDelete) return;
    setPostMenuVis(false);
    setPendingDelete(true);
    setActionError(null);
    undoTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          await client.deleteComment(post.id);
          setIsDeleted(true);
        } catch (error) {
          console.error("Failed to delete comment:", error);
          setPendingDelete(false);
          setActionError("Couldn't delete comment. Try again.");
        }
      })();
    }, UNDO_MS);
  }

  function undoDelete() {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setPendingDelete(false);
  }

  function callbackEdit(nextBody?: string) {
    setEditPost(false);
    if (nextBody !== undefined) setBody(nextBody);
  }

  if (isDeleted) return null;

  if (pendingDelete) {
    return (
      <output className="flex w-full flex-row flex-wrap items-center justify-between gap-2 rounded-lg bg-sd-bg-secondary px-3 py-2 text-[13px] text-sd-color-main">
        <span>Comment deleted.</span>
        <Button variant="secondary" type="button" onClick={undoDelete}>
          Undo
        </Button>
      </output>
    );
  }

  const replyActive = reply?.id === post.id;

  return (
    <div className="relative flex flex-col items-start">
      <div className="flex w-full flex-row">
        {showPfp && (
          <div className="relative shrink-0">
            <UserPfp details={post.authorDetails} />
          </div>
        )}
        <div className="ml-3 min-w-0 flex-1 flex-col">
          {showPfp && (
            <div className="flex flex-row items-center">
              <div className="flex min-w-0 flex-1 flex-row items-center">
                <span className="truncate text-[15px] font-medium text-sd-color-main">
                  <Username details={post.authorDetails} />
                </span>
              </div>
              <div className="sd-timestamp-mobile mr-2 flex shrink-0 items-center justify-self-end text-[12px] font-normal text-sd-color-secondary">
                <TimeAgo style={{ display: "flex", fontSize: 12 }} date={post.createdAt * 1000} locale="en-US" />
                {user && user.address === post.author && (
                  <>
                    <span className="mx-2 text-sd-color-secondary" aria-hidden="true">
                      ·
                    </span>
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-sd-color-secondary hover:bg-sd-bg-tertiary"
                        aria-label="Comment actions"
                        aria-expanded={postMenuVis}
                        aria-haspopup="menu"
                        onClick={() => setPostMenuVis((open) => !open)}
                      >
                        <MenuHorizontal />
                      </button>
                      {postMenuVis && (
                        <PostMenu
                          setPostMenuVis={setPostMenuVis}
                          setEditPost={setEditPost}
                          onConfirmDelete={scheduleDelete}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {editPost ? (
            <div className="mt-2">
              <Postbox
                showPfp={false}
                defaultComment={{ ...post, body }}
                callback={callbackEdit}
                ctaTitle="Save"
                setEditPost={setEditPost}
              />
            </div>
          ) : (
            <PostBody body={body} characterLimit={characterLimit} />
          )}

          {showCta && (
            <div className="mt-1 flex flex-row flex-wrap items-center">
              <button
                disabled={isLoading}
                type="button"
                className={`${actionButton} ${replyActive ? actionButtonActive : ""}`}
                aria-pressed={replyActive}
                onClick={() => setReply(replyActive ? null : post)}
              >
                <ReplyIcon type={replyActive ? "full" : "line"} />
                Reply
              </button>
              <button
                disabled={isLoading}
                type="button"
                className={`ml-1 ${actionButton} ${liked ? actionButtonActive : ""}`}
                aria-pressed={liked}
                aria-label={liked ? `Unlike, ${likeCount} likes` : `Like, ${likeCount} likes`}
                onClick={() => void like(!liked)}
              >
                <LikeIcon type={liked ? "full" : "line"} />
                <span>{liked ? "Liked" : "Like"}</span>
                {likeCount > 0 && <span className="tabular-nums text-sd-color-secondary">{likeCount}</span>}
              </button>
            </div>
          )}

          {actionError && (
            <p role="alert" className="m-0 mt-1 text-[13px] text-sd-color-danger">
              {actionError}
            </p>
          )}

          {replyActive && (
            <div className="mt-2">
              <Postbox reply={reply} callback={() => setReply(null)} placeholder="Add your reply..." ctaTitle="Reply" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostBody({
  body,
  characterLimit,
  showViewMore = true,
}: { body: string; characterLimit: number | null; showViewMore?: boolean }) {
  const { components } = useDiscussions();
  const Button = components.Button;
  const [charLimit, setCharLimit] = useState(characterLimit);
  const truncated = Boolean(charLimit && body.length > charLimit);
  const display = truncated && charLimit ? `${body.slice(0, charLimit)}…` : body;

  return (
    <>
      <div className="sd-post-content">{renderPlainTextWithLinks(display)}</div>
      {showViewMore && truncated && (
        <div className="mt-1 flex w-full justify-start">
          <Button variant="secondary" type="button" onClick={() => setCharLimit(null)}>
            View more
          </Button>
        </div>
      )}
    </>
  );
}

function PostMenu({
  setPostMenuVis,
  setEditPost,
  onConfirmDelete,
}: {
  setPostMenuVis: (v: boolean) => void;
  setEditPost: (v: boolean) => void;
  onConfirmDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useOutsideClick(wrapperRef, () => {
    if (confirmDelete) {
      setConfirmDelete(false);
      return;
    }
    setPostMenuVis(false);
  });

  const menuItem =
    "flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-sd-color-main hover:bg-sd-bg-tertiary disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div
      role="menu"
      aria-label="Comment actions"
      className="absolute right-0 top-full z-50 mt-1 min-w-[200px] space-y-1 overflow-hidden rounded-lg border border-sd-border-main bg-sd-bg-main px-2 py-2 text-[13px] shadow-md"
      ref={wrapperRef}
    >
      {!confirmDelete ? (
        <>
          <button
            type="button"
            role="menuitem"
            className={menuItem}
            onClick={() => {
              setPostMenuVis(false);
              setEditPost(true);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${menuItem} text-sd-color-danger`}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </button>
        </>
      ) : (
        <div className="space-y-1 px-1 py-1">
          <p className="m-0 px-2 py-1 text-[13px] text-sd-color-secondary">Delete this comment?</p>
          <div className="flex gap-1">
            <button type="button" className={menuItem} onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={`${menuItem} text-sd-color-danger`}
              onClick={() => {
                onConfirmDelete();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
