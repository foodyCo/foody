"use client";

import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, ImageUp, Star, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { GlassSurface } from "@/components/feed/glass-surface";
import {
  FULLSCREEN_SUBSCRIBE_BUTTON,
  SubscribeStyleButton,
} from "@/components/feed/subscribe-style-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createPost } from "@/app/actions/post";

const MAX_REVIEW_LENGTH = 2500;
const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";
const FIELD_SURFACE_CLASSES = cn(
  "h-[50px] rounded-[18px] border border-white/65 bg-transparent",
  "shadow-[0_8px_20px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)]",
  "backdrop-blur-[16px] backdrop-saturate-[170%] transition-shadow duration-150",
  "focus-within:ring-2 focus-within:ring-[#15291C]/12 focus-within:shadow-[0_10px_24px_rgba(20,40,28,0.1),inset_1px_1px_0_rgba(255,255,255,0.78)]"
);
const FIELD_INPUT_CLASSES =
  "h-full border-0 bg-transparent px-3.5 py-0 text-[15.5px] leading-[50px] font-semibold text-[#15291C] shadow-none outline-none placeholder:text-[#8A958E] focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent md:text-[15.5px]";

type NewReviewFormProps = {
  brand: string;
  categories?: string[];
};

type ReviewFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
};

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

function ReviewField({
  label,
  placeholder,
  value,
  inputMode,
  onChange,
}: ReviewFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[22px] leading-tight font-semibold tracking-[0px] text-[#15291C] max-[380px]:text-[20px]">
        {label}
      </span>
      <GlassSurface
        className={FIELD_SURFACE_CLASSES}
        contentClassName="h-full"
        tintClassName="before:bg-[#E8ECE9]/28 before:backdrop-blur-[16px] before:backdrop-saturate-[170%]"
        highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
      >
        <Input
          value={value}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={FIELD_INPUT_CLASSES}
        />
      </GlassSurface>
    </label>
  );
}

function RatingStar({
  brand,
  index,
  rating,
  shouldReduceMotion,
  onRate,
}: {
  brand: string;
  index: number;
  rating: number;
  shouldReduceMotion: boolean | null;
  onRate: (rating: number) => void;
}) {
  const fill = Math.max(0, Math.min(1, rating - index));

  function updateRating(event: ReactPointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const nextHalf = pointerX <= rect.width / 2 ? 0.5 : 1;

    onRate(index + nextHalf);
  }

  return (
    <motion.button
      type="button"
      aria-label={`Оценка ${index + 1}`}
      className="relative grid size-12 cursor-pointer place-items-center rounded-[15px] border border-white/62 bg-white/42 text-[#AAB4AE] shadow-[0_8px_18px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.78)] outline-none backdrop-blur-[14px] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 max-[380px]:size-10"
      onPointerDown={updateRating}
      whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.86, rotate: -3 } : undefined}
    >
      <Star className="size-7 max-[380px]:size-6" strokeWidth={2.1} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden rounded-[15px]"
        style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}
      >
        <Star
          className="size-7 max-[380px]:size-6"
          strokeWidth={2.1}
          color={brand}
          fill={brand}
        />
      </span>
    </motion.button>
  );
}

function RatingControl({
  brand,
  rating,
  shouldReduceMotion,
  onRate,
}: {
  brand: string;
  rating: number;
  shouldReduceMotion: boolean | null;
  onRate: (rating: number) => void;
}) {
  return (
    <section className="pt-1">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="flex-1 text-center text-[22px] leading-tight font-semibold text-[#15291C]">
          Оцените блюдо
        </h2>
        <span className="min-w-10 text-right text-[22px] leading-none font-extrabold text-[#15291C]">
          {rating.toFixed(1)}
        </span>
      </div>
      <div className="flex items-center justify-center gap-3 max-[380px]:gap-2.5">
        {[0, 1, 2, 3, 4].map((index) => (
          <RatingStar
            key={index}
            brand={brand}
            index={index}
            rating={rating}
            shouldReduceMotion={shouldReduceMotion}
            onRate={onRate}
          />
        ))}
      </div>
    </section>
  );
}

function PhotoUpload({
  files,
  onFilesChange,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFilesChange(Array.from(event.target.files ?? []));
  }

  return (
    <section>
      <h2 className="mb-2 text-[22px] leading-tight font-semibold tracking-[0px] text-[#15291C] max-[380px]:text-[20px]">
        Загрузите фотографию блюда
        <span className="ml-1 text-[13px] font-semibold text-[#15291C]">
          (мин. 1 шт.)
        </span>
      </h2>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex min-h-[122px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[26px] border border-white/65 bg-[#E8ECE9]/34 px-5 text-center text-[#15291C]",
          "shadow-[0_10px_24px_rgba(20,40,28,0.09),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] backdrop-blur-[18px] backdrop-saturate-[170%]",
          "outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
          PRESS_CLASSES
        )}
      >
        <ImageUp className="size-9" strokeWidth={2.15} />
        <span className="font-[family-name:var(--font-roboto)] text-[14px] font-medium text-[#5C6B62]">
          Выберите фотографии нажав сюда
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="sr-only"
      />
      {previews.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {previews.map((preview) => (
            <div
              key={preview.url}
              className="relative size-16 shrink-0 overflow-hidden rounded-[14px] border border-white/65 bg-white/42 shadow-[0_6px_14px_rgba(20,40,28,0.1)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={preview.name}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryButton({
  brand,
  categories,
  selected,
  onSelect,
}: {
  brand: string;
  categories: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  if (categories.length === 0) {
    return (
      <div
        className={cn(
          "flex h-[52px] w-full items-center gap-3 rounded-[18px] border-[0.5px] border-white/70 bg-white/60 px-4 text-left text-[#5C6B62]",
          "shadow-[inset_1px_1px_0_rgba(255,255,255,0.7),inset_-1px_-1px_0_rgba(255,255,255,0.3),0_4px_14px_rgba(20,40,28,0.06)] backdrop-blur-[20px]",
        )}
      >
        <span className="text-[14px] font-medium">Категории недоступны</span>
      </div>
    );
  }
  return (
    <label className="block">
      <span className="mb-2 block text-[22px] leading-tight font-semibold tracking-[0px] text-[#15291C] max-[380px]:text-[20px]">
        Категория
      </span>
      <div
        className={cn(
          "relative flex h-[52px] w-full items-center gap-3 rounded-[18px] border-[0.5px] border-white/70 bg-white/60 px-4 text-left text-[#15291C]",
          "shadow-[inset_1px_1px_0_rgba(255,255,255,0.7),inset_-1px_-1px_0_rgba(255,255,255,0.3),0_4px_14px_rgba(20,40,28,0.06)] backdrop-blur-[20px] backdrop-saturate-[180%]",
        )}
      >
        <span className="text-[15.5px] leading-snug font-bold tracking-[0px] text-[#15291C]">
          {selected || "Выберите категорию"}
        </span>
        <span className="ml-auto grid size-[26px] place-items-center rounded-full bg-[rgba(20,40,28,0.06)]">
          <ChevronRight size={14} strokeWidth={2.4} color={brand} />
        </span>
        <select
          value={selected ?? ""}
          onChange={(e) => onSelect(e.target.value || null)}
          aria-label="Категория"
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          <option value="">— не выбрана —</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function TagsInput({
  tags,
  tagDraft,
  onTagDraftChange,
  onAddTag,
  onRemoveTag,
}: {
  tags: string[];
  tagDraft: string;
  onTagDraftChange: (tag: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    onAddTag();
  }

  return (
    <section>
      <h2 className="text-[22px] leading-tight font-semibold text-[#15291C] max-[380px]:text-[20px]">
        Напишите тэги
      </h2>
      <p className="mt-1 mb-2 font-[family-name:var(--font-roboto)] text-[13px] leading-snug font-medium text-[#5C6B62]">
        Напишите тэг и добавьте его через ввод
      </p>
      <GlassSurface
        className={cn(FIELD_SURFACE_CLASSES, "min-h-[52px] h-auto")}
        tintClassName="before:bg-[#E8ECE9]/28 before:backdrop-blur-[16px] before:backdrop-saturate-[170%]"
        highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
      >
        <div className="flex min-h-[50px] flex-wrap items-center gap-1.5 px-2.5 py-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="inline-flex h-[28px] items-center gap-1 rounded-full bg-[rgba(46,204,113,0.14)] px-2.5 text-[12px] font-bold text-[#0E8A4F]"
            >
              <span>#{tag}</span>
              <X className="size-3" strokeWidth={2.2} />
            </button>
          ))}
          <Input
            value={tagDraft}
            onChange={(event) => onTagDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите тэг"
            className={cn(FIELD_INPUT_CLASSES, "h-8 min-w-[120px] flex-1 px-1.5")}
          />
        </div>
      </GlassSurface>
    </section>
  );
}

export function NewReviewForm({ brand, categories = [] }: NewReviewFormProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [dish, setDish] = useState("");
  const [price, setPrice] = useState("");
  const [place, setPlace] = useState("");
  const [address, setAddress] = useState("");
  const [rating, setRating] = useState(4.5);
  const [photos, setPhotos] = useState<File[]>([]);
  const [review, setReview] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    setError(null);
    if (!dish.trim()) {
      setError("Укажите название блюда");
      return;
    }
    if (!place.trim()) {
      setError("Укажите название заведения");
      return;
    }
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("title", dish.trim());
    fd.append("description", review.trim());
    fd.append("userRating", String(rating));
    if (price.trim()) fd.append("price", price.trim());
    fd.append("restaurantName", place.trim());
    if (address.trim()) fd.append("restaurantAddress", address.trim());
    if (category) fd.append("category", category);
    tags.forEach((t) => fd.append("tags", t));
    photos.forEach((file) => fd.append("image", file));
    try {
      const res = await createPost(fd);
      if (res?.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }
      router.push("/profile");
    } catch (e: any) {
      setError(e?.message || "Не удалось опубликовать");
      setIsSubmitting(false);
    }
  }

  function handleBackClick() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  function addTag() {
    const normalizedTag = tagDraft.trim().replace(/^#/, "");

    if (!normalizedTag || tags.includes(normalizedTag)) {
      setTagDraft("");
      return;
    }

    setTags((currentTags) => [...currentTags, normalizedTag]);
    setTagDraft("");
  }

  return (
    <main className="absolute inset-0 overflow-hidden bg-[#F3F6F2]">
      <div className="absolute inset-0 flex flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(239,245,240,0.96))] pt-12.5">
        <section
          aria-label="Новый отзыв"
          className="hide-scroll flex-1 overflow-y-auto px-[18px] pb-25"
        >
          <header className="mb-5 flex items-center gap-4 pt-1">
            <motion.button
              type="button"
              aria-label="Назад"
              title="Назад"
              onClick={handleBackClick}
              className={cn(
                "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-[#15291C] outline-none",
                "border border-white/65 bg-white/58 shadow-[0_8px_20px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.86),inset_-1px_-1px_0_rgba(255,255,255,0.28)]",
                "backdrop-blur-[18px] backdrop-saturate-[180%] transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
              )}
              whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.92 } : undefined}
            >
              <ArrowLeft className="size-[18px]" strokeWidth={2.35} />
            </motion.button>
            <h1 className="text-[24px] leading-tight font-semibold tracking-[0px] text-[#15291C]">
              Новый отзыв
            </h1>
          </header>

          <div className="space-y-6">
            <ReviewField
              label="Что вы ели?"
              placeholder="Введите название блюда"
              value={dish}
              onChange={setDish}
            />

            <ReviewField
              label="Сколько стоило блюдо?"
              placeholder="Например: 450"
              value={price}
              inputMode="decimal"
              onChange={setPrice}
            />

            <section>
              <h2 className="mb-2 text-[22px] leading-tight font-semibold tracking-[0px] text-[#15291C] max-[380px]:text-[20px]">
                В каком заведении?
              </h2>
              <div className="space-y-1.5">
                <GlassSurface
                  className={FIELD_SURFACE_CLASSES}
                  contentClassName="h-full"
                  tintClassName="before:bg-[#E8ECE9]/28 before:backdrop-blur-[16px] before:backdrop-saturate-[170%]"
                  highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
                >
                  <Input
                    aria-label="Название заведения"
                    value={place}
                    onChange={(event) => setPlace(event.target.value)}
                    placeholder="Название заведения"
                    className={FIELD_INPUT_CLASSES}
                  />
                </GlassSurface>
                <GlassSurface
                  className={FIELD_SURFACE_CLASSES}
                  contentClassName="h-full"
                  tintClassName="before:bg-[#E8ECE9]/28 before:backdrop-blur-[16px] before:backdrop-saturate-[170%]"
                  highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
                >
                  <Input
                    aria-label="Адрес заведения"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Адрес заведения"
                    className={FIELD_INPUT_CLASSES}
                  />
                </GlassSurface>
              </div>
            </section>

            <RatingControl
              brand={brand}
              rating={rating}
              shouldReduceMotion={shouldReduceMotion}
              onRate={setRating}
            />

            <PhotoUpload files={photos} onFilesChange={setPhotos} />

            <section>
              <div className="mb-2 flex items-end justify-between gap-3">
                <h2 className="text-[22px] leading-tight font-semibold text-[#15291C] max-[380px]:text-[20px]">
                  Напишите отзыв
                </h2>
                <span className="pb-0.5 text-[12px] font-bold text-[#5C6B62]">
                  {review.length}/{MAX_REVIEW_LENGTH}
                </span>
              </div>
              <GlassSurface
                className="min-h-[124px] rounded-[22px] border border-white/65 bg-transparent shadow-[0_8px_20px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] backdrop-blur-[16px] backdrop-saturate-[170%] transition-shadow duration-150 focus-within:ring-2 focus-within:ring-[#15291C]/12"
                tintClassName="before:bg-[#E8ECE9]/28 before:backdrop-blur-[16px] before:backdrop-saturate-[170%]"
                highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
              >
                <Textarea
                  value={review}
                  maxLength={MAX_REVIEW_LENGTH}
                  onChange={(event) => setReview(event.target.value)}
                  placeholder="Что понравилось, что можно улучшить?"
                  className="min-h-[124px] resize-none border-0 bg-transparent px-3.5 py-3 text-[15px] font-medium text-[#15291C] shadow-none outline-none placeholder:text-[#8A958E] focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent md:text-[15px]"
                />
              </GlassSurface>
            </section>

            <CategoryButton
              brand={brand}
              categories={categories}
              selected={category}
              onSelect={setCategory}
            />

            <TagsInput
              tags={tags}
              tagDraft={tagDraft}
              onTagDraftChange={setTagDraft}
              onAddTag={addTag}
              onRemoveTag={(tag) =>
                setTags((currentTags) =>
                  currentTags.filter((currentTag) => currentTag !== tag)
                )
              }
            />

            {error && (
              <div className="rounded-2xl border border-red-300 bg-red-50/80 px-4 py-3 text-center text-[14px] font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-center pt-5">
              <SubscribeStyleButton
                ariaLabel="Опубликовать"
                brand={brand}
                shouldReduceMotion={shouldReduceMotion}
                onClick={handlePublish}
                className={cn(
                  FULLSCREEN_SUBSCRIBE_BUTTON.regular,
                  "h-12 min-w-[256px] px-7 text-[18px] font-semibold",
                  isSubmitting && "pointer-events-none opacity-60"
                )}
              >
                <span>{isSubmitting ? "Публикация..." : "Опубликовать"}</span>
              </SubscribeStyleButton>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
