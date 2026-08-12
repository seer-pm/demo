import { type FormEvent, type KeyboardEvent, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { CommentsContext } from "../../contexts/DiscussionsContext";
import { useDiscussions } from "../../hooks/useDiscussions";
import type { Comment } from "../../types";
import ConnectButton from "../ConnectButton/ConnectButton";
import { UserPfp, Username } from "../User/User";

type PostboxProps = {
  showPfp?: boolean;
  reply?: Comment | null;
  callback?: (body?: string) => void;
  minInputHeight?: number;
  defaultComment?: Comment;
  setEditPost?: (v: boolean) => void;
  ctaTitle?: string;
  placeholder?: string;
  ascending?: boolean;
};

function useModKeyLabel() {
  return useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl";
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl";
  }, []);
}

export default function Postbox({
  showPfp = true,
  reply = null,
  callback,
  minInputHeight = 50,
  defaultComment,
  setEditPost,
  ctaTitle = "Comment",
  placeholder = "Share your take...",
  ascending = false,
}: PostboxProps) {
  const { user, client, components } = useDiscussions();
  const { setComments } = useContext(CommentsContext);
  const [sharing, setSharing] = useState(false);
  const [body, setBody] = useState(defaultComment?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errorId = useId();
  const Button = components.Button;
  const signedIn = Boolean(user);
  const modKey = useModKeyLabel();

  useEffect(() => {
    if (defaultComment) setBody(defaultComment.body);
  }, [defaultComment]);

  useEffect(() => {
    if (reply && signedIn && textareaRef.current) textareaRef.current.focus();
  }, [reply, signedIn]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!signedIn || sharing || !client || !user) return;

    const trimmed = body.trim();
    if (!trimmed) {
      setError("Write something before posting.");
      textareaRef.current?.focus();
      return;
    }
    if (trimmed.length > 5000) {
      setError("Comments are limited to 5000 characters.");
      textareaRef.current?.focus();
      return;
    }

    setError(null);
    setSharing(true);

    try {
      if (defaultComment) {
        await client.editComment(defaultComment.id, trimmed);
        callback?.(trimmed);
      } else {
        const parentId = reply?.id ?? null;
        const { id } = await client.createComment({ body: trimmed, parentId });
        const optimistic: Comment = {
          id,
          createdAt: Math.round(Date.now() / 1000),
          authorDetails: user,
          author: user.address,
          body: trimmed,
          parentId,
          likeCount: 0,
          likedByMe: false,
        };
        setComments((prev) => (ascending ? [...prev, optimistic] : [optimistic, ...prev]));
        callback?.();
      }

      setBody("");
    } catch (err) {
      console.error("Failed to submit comment:", err);
      setError("Couldn't post. Check your connection and try again.");
    } finally {
      setSharing(false);
    }
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="relative flex flex-1 flex-row items-start justify-center rounded-md">
      {showPfp && (
        <div className="relative mr-3 flex shrink-0 max-[600px]:hidden">
          <UserPfp details={user} />
        </div>
      )}
      <div className="relative flex min-w-0 flex-1">
        <form className="w-full" onSubmit={(e) => void handleSubmit(e)}>
          <div
            className={`w-full overflow-hidden rounded-lg ${
              signedIn
                ? `border border-sd-border-main bg-sd-bg-main focus-within:border-sd-focus-border ${sharing ? "bg-sd-bg-tertiary" : ""}`
                : "border border-sd-border-main bg-sd-bg-secondary"
            }`}
          >
            {reply && (
              <div className="flex flex-row items-center px-2 pb-0 pt-1 text-[13px]">
                <span className="mr-1 text-[13px] text-sd-color-secondary">Replying to:</span>
                <div className="rounded-md bg-sd-badge-bg p-1 font-medium text-sd-badge-color">
                  <Username details={reply.authorDetails} />
                </div>
              </div>
            )}
            {signedIn ? (
              <textarea
                ref={textareaRef}
                value={body}
                placeholder={placeholder}
                aria-label={placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                disabled={sharing}
                rows={2}
                className="block w-full resize-none border-0 bg-transparent p-3 text-[15px] text-sd-color-main outline-none placeholder:text-sd-input-placeholder disabled:opacity-70"
                style={{ minHeight: minInputHeight }}
                onChange={(e) => {
                  setBody(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={onComposerKeyDown}
              />
            ) : (
              <p
                className="m-0 block select-none p-3 text-[15px] text-sd-input-placeholder"
                style={{ minHeight: minInputHeight }}
              >
                Connect your wallet to share your take
              </p>
            )}
            {error && (
              <p id={errorId} role="alert" className="m-0 px-3 pb-2 text-[13px] text-sd-color-danger">
                {error}
              </p>
            )}
            <div className={`flex items-center gap-2 p-3 pt-0 ${signedIn ? "justify-between" : "justify-end"}`}>
              {signedIn ? (
                <>
                  <p className="m-0 text-[12px] text-sd-color-secondary">{modKey}+Enter to post</p>
                  <div className="flex gap-2">
                    {defaultComment && setEditPost && !sharing && (
                      <Button variant="secondary" type="button" onClick={() => setEditPost(false)}>
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" variant="primary" disabled={sharing} isLoading={sharing}>
                      {sharing ? "Sending" : ctaTitle}
                    </Button>
                  </div>
                </>
              ) : (
                <ConnectButton title="Connect to comment" />
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
