"use client";

import { registerUser } from "@/app/actions/auth";
import { useState } from "react";
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

    const IMAGE_URL = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop";

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
        <div className={styles.container}>
            <section className={styles.heroSection}>
                <img src={IMAGE_URL} alt="Hero background" className={styles.imageBackground} />
                <div className={styles.overlay}></div>
                <div className={styles.heroContent}>
                    <h1 className={styles.whiteLogo}>Foody</h1>
                    <h2 className={styles.whiteSubtitle}>
                        Присоединяйтесь к нам, чтобы находить лучшие блюда и заведения
                    </h2>
                </div>
            </section>

            <main className={styles.bottomSheet}>
                <div className={styles.formContainer}>
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(new FormData(e.currentTarget));
                        }} 
                        className={styles.form}
                    >
                        <div className={styles.inputGroupWrapper}>
                            <div className={styles.inputGroup}>
                                <User className={styles.inputIcon} size={24} />
                                <input
                                    className={styles.input}
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ваше имя"
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroupWrapper}>
                            <div className={styles.inputGroup}>
                                <Mail className={styles.inputIcon} size={24} />
                                <input
                                    className={styles.input}
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Электронная почта"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className={styles.inputGroupWrapper}>
                            <div className={styles.inputGroup}>
                                <Lock className={styles.inputIcon} size={24} />
                                <input
                                    className={styles.input}
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Надежный пароль"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className={styles.eyeButton}
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div style={{ color: "red", fontSize: 14, textAlign: "center" }}>{error}</div>
                        )}
                        
                        <div style={{ paddingTop: "8px" }}>
                            <button 
                                className={styles.submitBtn} 
                                type="submit" 
                                disabled={isPending}
                            >
                                {isPending ? "Регистрация..." : "Зарегистрироваться"}
                            </button>
                        </div>
                        
                        <div className={styles.bottomLink}>
                            <p>Уже есть аккаунт? <Link href="/login">Войти</Link></p>
                        </div>
                    </form>
                </div>
            </main>

            <footer className={styles.footerWrapper}>
                <p className={styles.disclaimer}>
                    Продолжая, вы соглашаетесь с Политикой конфиденциальности Foody
                </p>
            </footer>
        </div>
    );
}
