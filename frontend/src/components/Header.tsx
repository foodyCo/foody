"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { Suspense } from "react";
import styles from "./Header.module.css";

const SearchParamsTabs = () => {
    const searchParams = useSearchParams();
    return (
        <div className={styles.tabsContainer}>
            <Link href="/" className={`${styles.tab} ${searchParams?.get("tab") !== "following" ? styles.active : ""}`}>Рекомендации</Link>
            <Link href="/?tab=following" className={`${styles.tab} ${searchParams?.get("tab") === "following" ? styles.active : ""}`}>Подписки</Link>
        </div>
    );
};

const Header = () => {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const isAuthenticated = status === "authenticated";

    // Hide global header on profile and post pages
    if (pathname === "/profile" || pathname?.startsWith("/dish/") || pathname?.startsWith("/users/")) {
        return null;
    }

    return (
        <header className={styles.header}>
            <div className={styles.brandHeader}>
                <Link href="/" className={styles.brandName}>
                    Foody
                </Link>
                <div className={styles.rightGroup}>
                    {!isAuthenticated && status !== "loading" && (
                        <Link href="/login" className={styles.loginLink}>
                            Войти
                        </Link>
                    )}
                    <Link href="/search" className={styles.headerSearch}>
                        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
                    </Link>
                </div>
            </div>
            
            {pathname === "/" && (
                <Suspense fallback={<div className={styles.tabsContainer}><div className={`${styles.tab} ${styles.active}`}>Рекомендации</div><div className={styles.tab}>Подписки</div></div>}>
                    <SearchParamsTabs />
                </Suspense>
            )}
        </header>
    );
};

export default Header;
