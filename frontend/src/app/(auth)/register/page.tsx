"use client";

import React, { useState } from "react";
import { registerUser } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import styles from "../../auth.module.css";

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        setError(null);
        const res = await registerUser(formData);
        setIsPending(false);
        if (res?.error) {
            setError(res.error);
        } else {
            router.push("/profile");
            router.refresh();
        }
    }

    return (
        <>
            <div className={styles.ambientBg}></div>
            <div className={styles.noiseOverlay}></div>

            <div className={styles.authContainer}>
                
                <header className={styles.headerContent}>
                    <h1 className={styles.logoTitle}>Foody</h1>
                    <p className={styles.subtitle}>
                        Присоединяйтесь к нам, чтобы находить лучшие блюда и заведения
                    </p>
                </header>

                <main className={styles.glassCardBottom}>
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(new FormData(e.currentTarget));
                        }} 
                        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                    >
                        <div className={styles.glassInputWrapper}>
                            <User className={styles.inputIcon} />
                            <input
                                id="name"
                                type="text"
                                name="name"
                                className={styles.glassInput}
                                value={name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                placeholder="Ваше имя"
                                required
                            />
                        </div>

                        <div className={styles.glassInputWrapper}>
                            <Mail className={styles.inputIcon} />
                            <input
                                id="email"
                                type="email"
                                name="email"
                                className={styles.glassInput}
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                placeholder="Электронная почта"
                                required
                            />
                        </div>
                        
                        <div className={`${styles.glassInputWrapper} ${styles.glassInputWrapperMb3}`}>
                            <Lock className={styles.inputIcon} />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className={`${styles.glassInput} ${styles.glassInputPassword}`}
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                            </button>
                        </div>

                        {error && (
                            <div style={{ color: "var(--error, #e74c3c)", fontSize: 14, textAlign: "center", marginTop: "12px", fontWeight: 500 }}>
                                {error}
                            </div>
                        )}
                        
                        <button 
                            className={styles.glassBtnPrimary} 
                            type="submit" 
                            disabled={isPending}
                        >
                            {isPending ? "Регистрация..." : "Зарегистрироваться"}
                        </button>
                        
                        <div className={styles.flexGrow}></div>

                        <div className={styles.bottomContainer}>
                            <p className={styles.noAccountText}>
                                Уже есть аккаунт? <Link href="/login" className={styles.registerLink}>Войти</Link>
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
