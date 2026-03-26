"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createPost } from "@/app/actions/post";
import styles from "./page.module.css";

const CATEGORIES = [
  "Завтраки",
  "Бургеры",
  "Пицца",
  "Суши и Роллы",
  "Паста",
  "Мясо и Стейки",
  "Десерты",
  "Кофе",
  "Напитки",
  "Здоровая еда"
];

export default function CreatePostPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
      
      const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const movePhoto = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === files.length - 1) return;

    const targetIndex = direction === 'left' ? index - 1 : index + 1;

    setFiles((prev) => {
      const newFiles = [...prev];
      const temp = newFiles[index];
      newFiles[index] = newFiles[targetIndex];
      newFiles[targetIndex] = temp;
      return newFiles;
    });

    setPreviews((prev) => {
      const newPreviews = [...prev];
      const temp = newPreviews[index];
      newPreviews[index] = newPreviews[targetIndex];
      newPreviews[targetIndex] = temp;
      return newPreviews;
    });
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (files.length === 0 || !restaurantName || !dishName || !category || rating === 0) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", dishName);
      formData.append("description", description);
      formData.append("restaurantName", restaurantName);
      formData.append("userRating", rating.toString());
      formData.append("category", category);
      
      files.forEach((file) => {
        formData.append("image", file);
      });
      
      tags.forEach((tag) => {
        formData.append("tags", tag);
      });

      const res = await createPost(formData);
      if (res?.success) {
        router.push("/profile");
      } else if (res?.error === "UNAUTHORIZED") {
        alert("Сессия истекла, пожалуйста, войдите заново");
        router.push("/login");
      } else {
        console.error(res?.error);
        alert(res?.error || "Ошибка при создании поста");
      }
    } catch (err) {
      console.error(err);
      alert("Непредвиденная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = files.length > 0 && restaurantName && dishName && category && rating > 0 && !isLoading;

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 className={styles.pageTitle}>Новый отзыв</h1>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.formSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span className={styles.sectionLabel}>Фото и Видео ({files.length}/10)</span>
          </div>
          
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple 
              accept="image/*,video/*" 
              style={{ display: 'none' }} 
            />
            {previews.length > 0 ? (
              <div className={styles.previewGrid}>
                {previews.map((preview, index) => (
                  <div key={index} className={styles.previewImageContainer}>
                    <div className={styles.imageOrderBadge}>{index + 1}</div>
                    <Image src={preview} alt={`preview ${index}`} fill className={styles.previewImage} />
                    
                    {index > 0 && (
                      <button 
                         className={styles.swapBtnLeft}
                         onClick={(e) => { e.stopPropagation(); movePhoto(index, 'left'); }}
                      >
                        <svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41L7.83 13H20v-2z"/></svg>
                      </button>
                    )}

                    {index < previews.length - 1 && (
                      <button 
                         className={styles.swapBtnRight}
                         onClick={(e) => { e.stopPropagation(); movePhoto(index, 'right'); }}
                      >
                        <svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                      </button>
                    )}

                    <button 
                      className={styles.removePhotoBtn} 
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(index);
                      }}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>
                ))}
                
                {previews.length < 10 && (
                  <div className={styles.addMoreBtn} onClick={() => fileInputRef.current?.click()}>
                    <svg viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    <span>Добавить</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.uploadArea} onClick={() => files.length === 0 && fileInputRef.current?.click()}>
                <svg viewBox="0 0 24 24">
                  <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
                </svg>
                <span>Загрузить</span>
              </div>
            )}
        </div>

        <div className={styles.formSection}>
          <span className={styles.sectionLabel}>Заведение</span>
          <input 
            type="text" 
            className={styles.formInput} 
            placeholder="Название заведения" 
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
          />
        </div>

        <div className={styles.formSection}>
          <span className={styles.sectionLabel}>Блюдо</span>
          <input 
            type="text" 
            className={styles.formInput} 
            placeholder="Что вы ели?" 
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
          />
        </div>

        <div className={styles.formSection}>
          <span className={styles.sectionLabel}>Категория</span>
          <button className={styles.categorySelectBtn} onClick={() => setIsCategoryModalOpen(true)}>
            <div className={styles.categorySelectLeft}>
              <svg viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className={styles.categoryName} style={{ color: category ? 'var(--text-main)' : 'var(--text-tertiary)' }}>
                {category || "Выберите категорию"}
              </span>
            </div>
            <svg className={styles.categoryChevron} viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </button>
        </div>

        <div className={styles.formSection}>
          <span className={styles.sectionLabel}>Ваша оценка</span>
          <div className={styles.ratingSection}>
            <div className={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i} 
                  className={`${styles.starLarge} ${i < rating ? styles.active : ''}`} 
                  viewBox="0 0 24 24"
                  onClick={() => setRating(i + 1)}
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <span className={styles.sectionLabel}>Описание</span>
          <textarea 
            className={styles.reviewTextarea} 
            placeholder="Поделитесь впечатлениями... (необязательно)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div className={styles.formSection}>
          <span className={styles.sectionLabel}>Теги</span>
          <div className={styles.tagsInput}>
            {tags.map(tag => (
              <div key={tag} className={styles.tagChip}>
                #{tag}
                <svg className={styles.removeTag} viewBox="0 0 24 24" onClick={() => removeTag(tag)}>
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </div>
            ))}
            <input 
              type="text" 
              className={styles.tagInputField} 
              placeholder={tags.length === 0 ? "Добавьте теги..." : ""}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
          </div>
        </div>
      </main>

      <div className={styles.footerFixed}>
        <button 
          className={`${styles.submitBtn} ${canSubmit ? styles.active : ''}`}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isLoading ? "Публикация..." : "Опубликовать"}
        </button>
      </div>

      {/* Category Modal */}
      <div className={`${styles.categoryModalOverlay} ${isCategoryModalOpen ? styles.active : ''}`} onClick={() => setIsCategoryModalOpen(false)}>
        <div className={styles.categoryModalContent} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeaderNav}>
            <h2 className={styles.modalHeaderTitle}>Категория</h2>
            <button className={styles.closeModalBtn} onClick={() => setIsCategoryModalOpen(false)}>
              <svg viewBox="0 0 24 24">
                 <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div className={styles.categoryList}>
            {CATEGORIES.map(cat => (
              <div 
                key={cat} 
                className={`${styles.categoryListItem} ${category === cat ? styles.selected : ''}`}
                onClick={() => {
                  setCategory(cat);
                  setIsCategoryModalOpen(false);
                }}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
