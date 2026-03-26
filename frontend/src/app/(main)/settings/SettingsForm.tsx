"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteAccount } from "@/app/actions/settings";
import styles from "./page.module.css";

export default function SettingsForm({ user }: { user: any }) {
    const router = useRouter();
    const [isDarkTheme, setIsDarkTheme] = useState(false);

    async function handleDeleteAccount() {
        if (confirm("Вы уверены? Это действие нельзя отменить. Все ваши данные будут удалены.")) {
            await deleteAccount();
            signOut({ callbackUrl: "/login" });
        }
    }

    return (
        <>
            <div className={styles.ambientBg}></div>

            <header className={styles.settingsHeader}>
                <button className={styles.backBtn} onClick={() => router.back()}>
                    <svg viewBox="0 0 24 24">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
                    </svg>
                </button>
                <h1 className={styles.headerTitle}>Настройки</h1>
            </header>

            <main className={styles.mainContent}>
                
                <span className={styles.sectionLabel}>Аккаунт</span>
                <div className={styles.settingsGroup}>
                    <div className={styles.settingsItem}>
                        <div className={styles.itemIcon}>
                            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
                        </div>
                        <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>Личные данные</span>
                            <span className={styles.itemSubtitle}>Имя, email, телефон</span>
                        </div>
                        <div className={`${styles.itemAction} ${styles.chevron}`}>
                            <svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                        </div>
                    </div>

                    <div className={styles.settingsItem}>
                        <div className={styles.itemIcon}>
                            <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path></svg>
                        </div>
                        <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>Безопасность</span>
                            <span className={styles.itemSubtitle}>Пароль и привязанные сервисы</span>
                        </div>
                        <div className={`${styles.itemAction} ${styles.chevron}`}>
                            <svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                        </div>
                    </div>

                    <div className={styles.settingsItem}>
                        <div className={styles.itemIcon}>
                            <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"></path></svg>
                        </div>
                        <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>Уведомления</span>
                            <span className={styles.itemSubtitle}>Лайки, отзывы, новые места</span>
                        </div>
                        <div className={`${styles.itemAction} ${styles.chevron}`}>
                            <svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                        </div>
                    </div>
                </div>

                <span className={styles.sectionLabel}>Приложение</span>
                <div className={styles.settingsGroup}>
                    <div className={styles.settingsItem}>
                        <div className={styles.itemIcon}>
                            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path></svg>
                        </div>
                        <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>Мой город</span>
                        </div>
                        <div className={styles.itemAction}>
                            <span className={styles.itemValueNeutral}>Ростов-на-Дону</span>
                            <span className={styles.chevron}><svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg></span>
                        </div>
                    </div>
                    
                    <div className={styles.settingsItem}>
                        <div className={styles.itemIcon}>
                            <svg viewBox="0 0 24 24"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"></path></svg>
                        </div>
                        <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>Настройка вкусов</span>
                        </div>
                        <div className={styles.itemAction}>
                            <span className={styles.itemValue}>Острое, Азия</span>
                            <span className={styles.chevron}><svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg></span>
                        </div>
                    </div>

                    <div className={styles.settingsItem} onClick={() => setIsDarkTheme(!isDarkTheme)}>
                        <div className={styles.itemIcon}>
                            <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"></path></svg>
                        </div>
                        <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>Темная тема</span>
                        </div>
                        <div className={styles.itemAction}>
                            <div className={`${styles.toggleSwitch} ${!isDarkTheme ? styles.toggleSwitchOff : ''}`}></div>
                        </div>
                    </div>
                </div>

                <span className={styles.sectionLabelDanger}>Опасная зона</span>
                <div className={styles.dangerGroup}>
                    <div className={styles.dangerItem} onClick={() => signOut({ callbackUrl: "/login" })}>
                        <span className={styles.dangerTitle}>Выйти из аккаунта</span>
                        <div className={styles.dangerIcon}>
                            <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"></path></svg>
                        </div>
                    </div>
                    
                    <div className={styles.dangerItem} onClick={handleDeleteAccount}>
                        <span className={styles.dangerTitle}>Удалить аккаунт</span>
                        <div className={styles.dangerIcon}>
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                        </div>
                    </div>
                </div>

                <div className={styles.appVersion}>
                    Foody App Version 1.0.4 (Build 42)
                </div>

            </main>
        </>
    );
}
