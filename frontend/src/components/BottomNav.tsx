"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

const BottomNav = () => {
    const pathname = usePathname();

    // Hide BottomNav on post/dish screens, auth screens, and create form
    if (pathname && (pathname.startsWith("/dish/") || pathname === "/login" || pathname === "/register" || pathname === "/create")) {
        return null;
    }

    return (
        <nav className={styles.bottomNav}>
            <Link href="/" className={`${styles.navItem} ${pathname === "/" ? styles.active : ""}`}>
                <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path></svg>
            </Link>
            
            <Link href="/create" className={styles.fabContainer}>
                <div className={styles.fab}>
                    <svg viewBox="0 0 24 24" width="28" height="28"><path d="M13 7h-2v4h-4v2h4v4h2v-4h4v-2h-4z"></path></svg>
                </div>
            </Link>
            
            <Link href="/profile" className={`${styles.navItem} ${pathname?.startsWith("/profile") ? styles.active : ""}`}>
                <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
            </Link>
        </nav>
    );
};

export default BottomNav;
