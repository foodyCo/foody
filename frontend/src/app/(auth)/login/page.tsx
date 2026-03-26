"use client";

import { authenticate } from "@/app/actions/auth";
import React, { useState, useTransition } from "react";
import Link from "next/link";
import styles from "../../auth.module.css";

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState("");
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const clientAction = (formData: FormData) => {
        setErrorMessage("");
        startTransition(() => {
            authenticate(undefined, formData).then((error) => {
                if (error) {
                    setErrorMessage(error);
                }
            }).catch((err) => {
                console.error("Auth action error:", err);
            });
        });
    };

    return (
        <>
            <div className={styles.ambientBg}></div>
            <div className={styles.noiseOverlay}></div>

            <div className={styles.authContainer}>
                
                <header className={styles.headerContent}>
                    <h1 className={styles.logoTitle}>Foody</h1>
                    <p className={styles.subtitle}>
                        С возвращением! Войдите, чтобы делиться отзывами и сохранять любимые блюда
                    </p>
                </header>

                <main className={styles.glassCardBottom}>
                    <form action={clientAction} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div className={styles.glassInputWrapper}>
                            <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path>
                            </svg>
                            <input 
                                type="email" 
                                name="email"
                                className={styles.glassInput} 
                                placeholder="Электронная почта (hello@foody.ru)" 
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={`${styles.glassInputWrapper} ${styles.glassInputWrapperMb3}`}>
                            <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path>
                            </svg>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password"
                                className={`${styles.glassInput} ${styles.glassInputPassword}`} 
                                placeholder="••••••••" 
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <button 
                                type="button" 
                                className={styles.eyeBtn} 
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg className="w-6 h-6" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path>
                                    </svg>
                                )}
                            </button>
                        </div>

                        <div className={styles.forgotPasswordContainer}>
                            <Link href="/forgot-password" className={styles.forgotPasswordLink}>
                                Забыли пароль?
                            </Link>
                        </div>

                        {errorMessage && (
                            <div style={{ color: "var(--error, #e74c3c)", fontSize: 14, textAlign: "center", marginTop: "12px", fontWeight: 500 }}>
                                {errorMessage}
                            </div>
                        )}

                        <button type="submit" disabled={isPending} className={styles.glassBtnPrimary}>
                            {isPending ? "Вход..." : "Войти"}
                        </button>

                        <div className={styles.flexGrow}></div>

                        <div className={styles.bottomContainer}>
                            <p className={styles.noAccountText}>
                                Нет аккаунта? <Link href="/register" className={styles.registerLink}>Зарегистрироваться</Link>
                            </p>
                            
                            <p className={styles.disclaimerText}>
                                ПРОДОЛЖАЯ, ВЫ СОГЛАШАЕТЕСЬ С<br />ПОЛИТИКОЙ КОНФИДЕНЦИАЛЬНОСТИ<br />FOODY
                            </p>
                        </div>
                    </form>
                </main>
            </div>
        </>
    );
}
