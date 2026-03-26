"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { UserPlus, UserCheck } from "lucide-react";
import { User } from "@/lib/data";
import { toggleFollow } from "@/app/actions/social";
import styles from "./AuthorSection.module.css";

interface AuthorSectionProps {
    author: User;
    initialIsSubscribed?: boolean;
    showFollowButton?: boolean;
}

const AuthorSection = ({ author, initialIsSubscribed = false, showFollowButton = true }: AuthorSectionProps) => {
    const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
    const { data: session } = useSession();
    const router = useRouter();

    const handleSubscribe = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session) {
            router.push("/login");
            return;
        }

        // Optimistic update
        const newIsSubscribed = !isSubscribed;
        setIsSubscribed(newIsSubscribed);

        const res = await toggleFollow(author.id, isSubscribed);
        if (res?.error) {
            console.error("Failed to toggle follow", res.error);
            setIsSubscribed(!newIsSubscribed);
        } else {
            router.refresh();
        }
    };

    const isSelf = session?.user?.id === author.id;

    return (
        <div className={styles.container}>
            <Link href={isSelf ? "/profile" : `/users/${author.id}`} className={styles.authorLink}>
                <div className={styles.authorInfo}>
                    <Image
                        src={author.avatar || "/default-avatar.svg"}
                        alt={author.name}
                        width={40}
                        height={40}
                        className={styles.avatar}
                    />
                    <div className={styles.textInfo}>
                        <span className={styles.name}>{author.name}</span>
                        <span className={styles.role}>Автор поста</span>
                    </div>
                </div>
            </Link>
            {showFollowButton && !isSelf && (
                <button
                    className={`${styles.subscribeBtn} ${isSubscribed ? styles.subscribed : ""}`}
                    onClick={handleSubscribe}
                >
                    {isSubscribed ? (
                        <>
                            <UserCheck size={16} />
                            <span>Вы подписаны</span>
                        </>
                    ) : (
                        <>
                            <UserPlus size={16} />
                            <span>Подписаться</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default AuthorSection;
