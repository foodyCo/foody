"use client";

import { ArrowRight, Heart, Reply, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  requestCommentLikeMutation,
  requestCommentLikes,
} from "@/lib/feed-api";
import type { PostComment } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { HEART_COLOR, canAnimate } from "./post-card/post-card-shared";

type CommentsSheetProps = {
  open: boolean;
  brand: string;
  comments: PostComment[];
  commentsCount: number;
  shouldReduceMotion: boolean | null;
  onClose: () => void;
};

type CommentRowProps = {
  brand: string;
  comment: PostComment;
  liked: boolean;
  likePending: boolean;
  onLikeToggle: (comment: PostComment, nextLiked: boolean) => void;
  onReply: (comment: PostComment) => void;
  shouldReduceMotion: boolean | null;
};

type CreateCommentPayload = {
  text: string;
  replyToCommentId?: PostComment["id"];
  replyToUser?: string;
};

const SHEET_TRANSITION = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
} as const;
const OVERLAY_TRANSITION = { duration: 0.22, ease: "easeOut" } as const;
// MVP: timestamps are hidden in the sheet, but can be restored by flipping this.
const SHOW_COMMENT_TIMESTAMPS = false;
const AVATAR_PALETTES: ReadonlyArray<readonly [string, string]> = [
  ["#FFD6A5", "#FF8FAB"],
  ["#A7C957", "#386641"],
  ["#FFC25C", "#E76F51"],
  ["#90DBF4", "#A78BFA"],
  ["#F2CC8F", "#81B29A"],
  ["#CDB4DB", "#FFAFCC"],
];
const CURRENT_USER: PostComment = {
  id: 0,
  user: "@you",
  realName: "Вы",
  when: "только что",
  text: "",
  likes: 0,
};

function getDisplayHandle(user: string) {
  return user.startsWith("@") ? user : `@${user}`;
}

function getAvatarInitial(name: string) {
  return (name || "?").replace("@", "").slice(0, 1).toUpperCase();
}

function getCommentIdKey(id: PostComment["id"]) {
  return String(id);
}

function isSameComment(left: PostComment, right: PostComment) {
  return (
    getCommentIdKey(left.id) === getCommentIdKey(right.id) ||
    (Boolean(left.clientId) && left.clientId === right.clientId)
  );
}

function isCommentDescendantOf(
  comment: PostComment,
  ancestorId: PostComment["id"],
  commentsById: Map<string, PostComment>
) {
  const ancestorKey = getCommentIdKey(ancestorId);
  const visitedCommentIds = new Set<string>();
  let currentParentId = comment.replyToCommentId;

  while (currentParentId !== undefined) {
    const currentParentKey = getCommentIdKey(currentParentId);

    if (currentParentKey === ancestorKey) {
      return true;
    }

    if (visitedCommentIds.has(currentParentKey)) {
      return false;
    }

    visitedCommentIds.add(currentParentKey);
    currentParentId = commentsById.get(currentParentKey)?.replyToCommentId;
  }

  return false;
}

function mergeCommentsWithSubmitted(
  comments: PostComment[],
  submittedComments: PostComment[]
) {
  const orderedComments = [...comments];

  for (const submittedComment of submittedComments) {
    if (
      orderedComments.some((comment) => isSameComment(comment, submittedComment))
    ) {
      continue;
    }

    const parentCommentId = submittedComment.replyToCommentId;

    if (parentCommentId === undefined) {
      orderedComments.push(submittedComment);
      continue;
    }

    const parentCommentIndex = orderedComments.findIndex(
      (comment) => getCommentIdKey(comment.id) === getCommentIdKey(parentCommentId)
    );

    if (parentCommentIndex === -1) {
      orderedComments.push(submittedComment);
      continue;
    }

    const commentsById = new Map(
      orderedComments.map((comment) => [getCommentIdKey(comment.id), comment])
    );
    let insertIndex = parentCommentIndex;

    while (
      insertIndex + 1 < orderedComments.length &&
      isCommentDescendantOf(
        orderedComments[insertIndex + 1],
        parentCommentId,
        commentsById
      )
    ) {
      insertIndex += 1;
    }

    orderedComments.splice(insertIndex + 1, 0, submittedComment);
  }

  return orderedComments;
}

function createClientCommentId() {
  if (globalThis.crypto?.randomUUID) {
    return `local-${globalThis.crypto.randomUUID()}`;
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createOptimisticComment(payload: CreateCommentPayload): PostComment {
  const clientId = createClientCommentId();

  return {
    ...CURRENT_USER,
    id: clientId,
    clientId,
    replyTo: payload.replyToUser,
    replyToCommentId: payload.replyToCommentId,
    status: "sent",
    text: payload.text,
  };
}

function getPersistedCommentIds(comments: PostComment[]) {
  return comments
    .filter((comment) => !comment.clientId)
    .map((comment) => comment.id);
}

function CommentAvatar({
  comment,
  size = 42,
  className,
}: {
  comment: PostComment;
  size?: number;
  className?: string;
}) {
  const seed = comment.user.charCodeAt(1) || 7;
  const [from, to] = AVATAR_PALETTES[seed % AVATAR_PALETTES.length];

  return (
    <Avatar
      className={cn(
        "shrink-0 shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.55)] after:hidden",
        className
      )}
      style={{ width: size, height: size }}
    >
      {comment.avatarUrl && (
        <AvatarImage src={comment.avatarUrl} alt={comment.realName} />
      )}
      <AvatarFallback
        className="font-extrabold tracking-tight text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
          fontSize: size * 0.42,
        }}
      >
        {getAvatarInitial(comment.user)}
      </AvatarFallback>
    </Avatar>
  );
}

export function CommentsSheet({
  open,
  brand,
  comments,
  commentsCount,
  shouldReduceMotion,
  onClose,
}: CommentsSheetProps) {
  const [draft, setDraft] = useState("");
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  const [commentLikesLoaded, setCommentLikesLoaded] = useState(false);
  const [localLikedCommentIds, setLocalLikedCommentIds] = useState<string[]>(
    []
  );
  const [pendingLikedCommentIds, setPendingLikedCommentIds] = useState<
    Set<string>
  >(() => new Set());
  const [replyTarget, setReplyTarget] = useState<PostComment | null>(null);
  const [submittedComments, setSubmittedComments] = useState<PostComment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAnimate = canAnimate(shouldReduceMotion);
  const visibleComments = useMemo(
    () => mergeCommentsWithSubmitted(comments, submittedComments),
    [comments, submittedComments]
  );
  const unsyncedSubmittedCommentsCount = useMemo(
    () =>
      submittedComments.filter(
        (submittedComment) =>
          !comments.some((comment) => isSameComment(comment, submittedComment))
      ).length,
    [comments, submittedComments]
  );
  const visibleCommentsCount = Math.max(
    commentsCount + unsyncedSubmittedCommentsCount,
    visibleComments.length
  );
  const likedCommentIdsSet = useMemo(
    () => new Set(likedCommentIds),
    [likedCommentIds]
  );
  const localLikedCommentIdsSet = useMemo(
    () => new Set(localLikedCommentIds),
    [localLikedCommentIds]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const commentIds = getPersistedCommentIds(visibleComments);

    if (commentIds.length === 0) {
      return;
    }

    let isActive = true;

    void requestCommentLikes(commentIds)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setLikedCommentIds(response.likedCommentIds);
        setCommentLikesLoaded(true);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setLikedCommentIds(
          visibleComments
            .filter((comment) => comment.liked)
            .map((comment) => getCommentIdKey(comment.id))
        );
        setCommentLikesLoaded(true);
      });

    return () => {
      isActive = false;
    };
  }, [open, visibleComments]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setReplyTarget(null);
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";

    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 20;
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
    const maxHeight = lineHeight * 5 + paddingTop + paddingBottom;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [draft, open]);

  function closeSheet() {
    setReplyTarget(null);
    onClose();
  }

  function handleBackdropClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeSheet();
    }
  }

  function handleReply(comment: PostComment) {
    setReplyTarget(comment);
    textareaRef.current?.focus();
  }

  async function handleLikeToggle(comment: PostComment, nextLiked: boolean) {
    const commentId = getCommentIdKey(comment.id);

    if (comment.clientId) {
      setLocalLikedCommentIds((currentCommentIds) => {
        const nextCommentIds = new Set(currentCommentIds);

        if (nextLiked) {
          nextCommentIds.add(commentId);
        } else {
          nextCommentIds.delete(commentId);
        }

        return Array.from(nextCommentIds);
      });
      return;
    }

    if (pendingLikedCommentIds.has(commentId)) {
      return;
    }

    setPendingLikedCommentIds((currentCommentIds) => {
      const nextCommentIds = new Set(currentCommentIds);
      nextCommentIds.add(commentId);

      return nextCommentIds;
    });

    try {
      const result = await requestCommentLikeMutation(comment.id, nextLiked);

      setLikedCommentIds(result.likedCommentIds);
    } catch {
      return;
    } finally {
      setPendingLikedCommentIds((currentCommentIds) => {
        const nextCommentIds = new Set(currentCommentIds);
        nextCommentIds.delete(commentId);

        return nextCommentIds;
      });
    }
  }

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const text = draft.trim();

    if (!text) {
      return;
    }

    const nextComment = createOptimisticComment({
      text,
      replyToCommentId: replyTarget?.id,
      replyToUser: replyTarget?.user,
    });

    setSubmittedComments((currentComments) => [...currentComments, nextComment]);
    setDraft("");
    setReplyTarget(null);
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex h-[100dvh] w-screen items-end justify-center overflow-hidden bg-black/42 px-0 pt-10 [-webkit-tap-highlight-color:transparent]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={OVERLAY_TRANSITION}
          onClick={handleBackdropClick}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="comments-sheet-title"
            className={cn(
              "flex h-[min(86dvh,46rem)] w-full max-w-[33rem] flex-col overflow-hidden rounded-t-[30px] bg-white font-sans text-[#020403]",
              "shadow-[0_-18px_54px_rgba(0,0,0,0.24)] ring-1 ring-black/[0.04]",
              "max-[430px]:h-[88dvh] max-[430px]:rounded-t-[28px]"
            )}
            initial={shouldAnimate ? { y: "100%" } : { y: 0 }}
            animate={{ y: 0 }}
            exit={shouldAnimate ? { y: "100%" } : { opacity: 0 }}
            transition={SHEET_TRANSITION}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 flex-col border-b border-black/[0.06] px-7 pt-3.5 pb-5 max-[430px]:px-5">
              <div
                aria-hidden="true"
                className="mx-auto mb-5 h-1.5 w-11 rounded-full bg-[#D9DADC]"
              />
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="comments-sheet-title"
                  className="min-w-0 text-[20px] leading-tight font-extrabold tracking-normal text-black"
                >
                  Комментарии{" "}
                  <span className="align-baseline text-[11px] font-extrabold text-[#98A1AA] tabular-nums">
                    {visibleCommentsCount}
                  </span>
                </h2>
                <motion.button
                  type="button"
                  aria-label="Закрыть комментарии"
                  className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-black outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-black/15"
                  whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                  onClick={closeSheet}
                >
                  <X className="size-6" strokeWidth={2.3} />
                </motion.button>
              </div>
            </div>

            <div className="hide-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-7 py-6 max-[430px]:px-5">
              <div className="space-y-7">
                {visibleComments.map((comment) => (
                  <CommentRow
                    key={comment.id}
                    brand={brand}
                    comment={comment}
                    liked={
                      comment.clientId
                        ? localLikedCommentIdsSet.has(getCommentIdKey(comment.id))
                        : commentLikesLoaded
                          ? likedCommentIdsSet.has(getCommentIdKey(comment.id))
                          : Boolean(comment.liked)
                    }
                    likePending={pendingLikedCommentIds.has(
                      getCommentIdKey(comment.id)
                    )}
                    onLikeToggle={handleLikeToggle}
                    onReply={handleReply}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-black/[0.06] bg-white px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] max-[430px]:px-4">
              <AnimatePresence initial={false}>
                {replyTarget && (
                  <motion.div
                    key="reply-target"
                    className="mb-2 flex h-8 items-center gap-2 rounded-full bg-[#F1F3F4] px-3 text-[13px] font-bold text-[#6F7882]"
                    initial={shouldAnimate ? { opacity: 0, y: 5 } : { opacity: 1 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldAnimate ? { opacity: 0, y: 5 } : { opacity: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                  >
                    <Reply className="size-3.5 shrink-0" strokeWidth={2.4} />
                    <span className="min-w-0 flex-1 truncate">
                      {getDisplayHandle(replyTarget.user)}
                    </span>
                    <button
                      type="button"
                      aria-label="Отменить ответ"
                      className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[#8B949E] outline-none transition-colors hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-black/10"
                      onClick={() => setReplyTarget(null)}
                    >
                      <X className="size-3.5" strokeWidth={2.4} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form className="flex items-end gap-2.5" onSubmit={handleSubmit}>
                <CommentAvatar
                  comment={CURRENT_USER}
                  size={40}
                  className="mb-0.5"
                />
                <div className="flex min-h-10 min-w-0 flex-1 items-start overflow-hidden rounded-[20px] bg-[#F3F5F6] px-4 py-2 transition-colors focus-within:bg-[#EFF2F0]">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={draft}
                    aria-label={
                      replyTarget
                        ? `Ответить ${getDisplayHandle(replyTarget.user)}`
                        : "Добавить комментарий"
                    }
                    placeholder={
                      replyTarget
                        ? `Ответить ${getDisplayHandle(replyTarget.user)}...`
                        : "Добавить комментарий..."
                    }
                    className="hide-scroll block max-h-[7.5rem] min-h-6 w-full min-w-0 resize-none overflow-x-hidden bg-transparent p-0 font-[family-name:var(--font-roboto)] text-[15px] leading-6 font-medium break-words whitespace-pre-wrap text-[#15291C] outline-none placeholder:text-[#8F98A3]"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleDraftKeyDown}
                  />
                </div>
                <motion.button
                  type="submit"
                  aria-label="Отправить комментарий"
                  disabled={draft.trim().length === 0}
                  className="relative grid size-11 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-transparent text-[#0B2F1D] shadow-[inset_1px_1px_0_rgba(255,255,255,0.18),inset_-1px_-1px_0_rgba(11,47,29,0.05)] outline-none backdrop-blur-[18px] backdrop-saturate-[180%] transition-opacity focus-visible:ring-2 focus-visible:ring-[#15291C]/18 disabled:cursor-default disabled:opacity-45 [-webkit-tap-highlight-color:transparent]"
                  style={{
                    boxShadow: `0 8px 18px ${brand}1F, inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(11,47,29,0.05)`,
                  }}
                  whileTap={shouldAnimate && draft.trim() ? { scale: 0.92 } : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `linear-gradient(140deg, color-mix(in srgb, ${brand} 60%, transparent), rgba(122,236,164,0.92), rgba(100,218,189,0.60), color-mix(in srgb, ${brand} 88%, transparent))`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-px rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.36),rgba(226,255,235,0.22))]"
                  />
                  <ArrowRight
                    className="relative z-[1] size-5"
                    color="#020403"
                    strokeWidth={2.8}
                  />
                </motion.button>
              </form>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function CommentRow({
  brand,
  comment,
  liked,
  likePending,
  onLikeToggle,
  onReply,
  shouldReduceMotion,
}: CommentRowProps) {
  const shouldAnimate = canAnimate(shouldReduceMotion);
  const likeCount = comment.likes + (liked ? 1 : 0) - (comment.liked ? 1 : 0);

  return (
    <article
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_2.25rem] gap-x-3",
        comment.replyTo && "pl-11 max-[430px]:pl-8"
      )}
    >
      <CommentAvatar comment={comment} size={42} className="mt-0.5" />

      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-[15.5px] leading-tight font-extrabold tracking-normal text-black">
            {comment.realName}
          </span>
          {SHOW_COMMENT_TIMESTAMPS && (
            <span className="shrink-0 text-[12px] leading-tight font-bold text-[#99A1AB]">
              {comment.when}
            </span>
          )}
        </div>

        <p className="mt-1 font-[family-name:var(--font-roboto)] text-[15.5px] leading-[1.46] font-medium text-black">
          {comment.replyTo && (
            <>
              <span className="font-medium" style={{ color: brand }}>
                {getDisplayHandle(comment.replyTo)}
              </span>{" "}
            </>
          )}
          {comment.text}
        </p>

        <motion.button
          type="button"
          className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-[12.5px] leading-tight font-extrabold text-[#65707A] outline-none transition-colors hover:text-[#15291C] focus-visible:ring-2 focus-visible:ring-black/10"
          whileHover={shouldAnimate ? { y: 1 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.96, y: 4 } : undefined}
          transition={{ duration: 0.16, ease: "easeOut" }}
          onClick={() => onReply(comment)}
        >
          Ответить
        </motion.button>
      </div>

      <button
        type="button"
        aria-label="Нравится комментарий"
        aria-busy={likePending}
        aria-pressed={liked}
        disabled={likePending}
        className="mt-1 flex h-11 w-8 cursor-pointer flex-col items-center justify-start rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => onLikeToggle(comment, !liked)}
      >
        <motion.span
          className="grid size-5 place-items-center"
          whileTap={shouldAnimate ? { scale: 0.84 } : undefined}
          animate={liked ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <Heart
            className="size-5"
            strokeWidth={2}
            color={liked ? HEART_COLOR : "#8B949E"}
            fill={liked ? HEART_COLOR : "none"}
          />
        </motion.span>
        <span className="mt-0.5 text-[11px] leading-none font-bold text-[#65707A] tabular-nums">
          {likeCount}
        </span>
      </button>
    </article>
  );
}
