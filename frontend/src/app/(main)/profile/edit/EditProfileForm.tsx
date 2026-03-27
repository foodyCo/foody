"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { updateProfile } from "@/app/actions/profile";

const RUSSIAN_CITIES = [
    "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
    "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
    "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград", "Краснодар",
    "Саратов", "Тюмень", "Тольятти", "Ижевск", "Барнаул", "Ульяновск",
    "Иркутск", "Хабаровск", "Ярославль", "Владивосток", "Махачкала",
    "Томск", "Оренбург", "Кемерово", "Новокузнецк", "Рязань", "Астрахань",
    "Набережные Челны", "Пенза", "Липецк", "Тула", "Киров", "Чебоксары",
    "Калининград", "Брянск", "Курск", "Иваново", "Магнитогорск", "Тверь",
    "Ставрополь", "Белгород", "Сочи",
];

interface UserData {
    name: string;
    username: string;
    avatar: string;
    bio: string;
    city: string;
}

export default function EditProfileForm({ initialData }: { initialData: UserData }) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(initialData.name);
    const [username, setUsername] = useState(initialData.username);
    const [bio, setBio] = useState(initialData.bio);
    const [city, setCity] = useState(initialData.city);
    const [previewUrl, setPreviewUrl] = useState<string>(initialData.avatar);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (!selected.type.startsWith("image/")) {
                setError("Пожалуйста, загрузите изображение (JPG, PNG)");
                return;
            }
            setError(null);
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleCancel = () => {
        router.back();
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("full_name", name);
            formData.append("username", username);
            formData.append("bio_text", bio);
            formData.append("city", city);

            if (file) {
                formData.append("avatar", file);
            }

            const res = await updateProfile(formData);
            if (res?.error) {
                setError(res.error);
            } else {
                router.push("/profile");
                router.refresh();
            }
        } catch (e: any) {
            setError(e.message || "Ошибка при сохранении");
        } finally {
            setIsLoading(false);
        }
    };

    const isChanged = name !== initialData.name ||
                      username !== initialData.username ||
                      bio !== initialData.bio ||
                      city !== initialData.city ||
                      file !== null;

    return (
        <>
            <div className={styles.ambientBg}></div>

            <header className={styles.editHeader}>
                <button type="button" onClick={handleCancel} className={`${styles.headerBtn} ${styles.btnCancel}`}>
                    Отмена
                </button>
                <h1 className={styles.headerTitle}>Редактировать</h1>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className={`${styles.headerBtn} ${styles.btnSave}`}
                    disabled={!isChanged || isLoading}
                >
                    {isLoading ? "..." : "Сохранить"}
                </button>
            </header>

            <main className={styles.mainContent}>

                {error && (
                    <div style={{ color: 'var(--error-red)', textAlign: 'center', marginBottom: '16px', background: 'var(--error-bg)', padding: '12px', borderRadius: '12px' }}>
                        {error}
                    </div>
                )}

                <section className={styles.photoSection}>
                    <div className={styles.avatarWrapper} onClick={triggerFileInput} style={{ cursor: 'pointer' }}>
                        <Image
                            src={previewUrl}
                            alt={name || "Profile"}
                            className={styles.avatarImg}
                            fill
                            sizes="112px"
                        />
                        <div className={styles.editBadge}>
                            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                        </div>
                    </div>
                    <button type="button" onClick={triggerFileInput} className={styles.changePhotoBtn}>
                        Изменить фото
                    </button>
                    <input
                        ref={fileInputRef}
                        className={styles.fileInput}
                        type="file"
                        name="avatar"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </section>

                <div className={styles.formContainer}>

                    <div className={styles.formGroup}>
                        <div className={styles.formLabelRow}>
                            <label className={styles.formLabel}>Имя</label>
                        </div>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Alex Curator"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <div className={styles.formLabelRow}>
                            <label className={styles.formLabel}>Никнейм</label>
                        </div>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="@foody_user"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <div className={styles.formLabelRow}>
                            <label className={styles.formLabel}>Город</label>
                        </div>
                        <select
                            className={styles.formInput}
                            value={city}
                            onChange={e => setCity(e.target.value)}
                        >
                            <option value="">Не указан</option>
                            {RUSSIAN_CITIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <div className={styles.formLabelRow}>
                            <label className={styles.formLabel}>О себе</label>
                            <span className={styles.charCount}>{bio.length} / 250 символов</span>
                        </div>
                        <textarea
                            className={styles.formTextarea}
                            value={bio}
                            onChange={e => setBio(e.target.value.substring(0, 250))}
                            placeholder="Расскажите о себе..."
                        />
                    </div>

                </div>

            </main>
        </>
    );
}
