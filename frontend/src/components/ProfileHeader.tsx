"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Edit2, UserPlus, UserCheck } from "lucide-react";
import { User } from "@/lib/data";
import Link from "next/link";
import { toggleFollow } from "@/app/actions/social";
import styles from "./ProfileHeader.module.css";

interface ProfileHeaderProps {
    user: User;
    stats: {
        posts: number;
        followers: number;
        following: number;
    };
    isCurrentUser?: boolean;
    initialIsFollowing?: boolean;
}

const ProfileHeader = ({ user, stats, isCurrentUser = false, initialIsFollowing = false }: ProfileHeaderProps) => {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [followersCount, setFollowersCount] = useState(stats.followers);
    const { data: session } = useSession();
    const router = useRouter();

    const handleFollow = async () => {
        if (!session) {
            router.push("/login");
            return;
        }

        const newIsFollowing = !isFollowing;
        setIsFollowing(newIsFollowing);
        setFollowersCount(prev => newIsFollowing ? prev + 1 : prev - 1);

        const res = await toggleFollow(user.id.toString(), null as any);
        if (res?.error) {
            setIsFollowing(!newIsFollowing);
            setFollowersCount(prev => !newIsFollowing ? prev + 1 : prev - 1);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.topRow}>
                <div className={styles.avatarContainer}>
                    <Image
                        src={user.avatar || "/default-avatar.svg"}
                        alt={user.name}
                        fill
                        className={styles.avatar}
                        priority
                    />
                </div>

                <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.posts}</span>
                        <span className={styles.statLabel}>Посты</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{followersCount}</span>
                        <span className={styles.statLabel}>Подписчики</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.following}</span>
                        <span className={styles.statLabel}>Подписки</span>
                    </div>
                </div>
            </div>

            <div className={styles.info}>
                <h1 className={styles.name}>{user.name}</h1>
                <p className={styles.bio}>{user.bio}</p>
            </div>

            <div className={styles.actions}>
                {isCurrentUser ? (
                    <>
                        <Link href="/profile/edit" className={styles.editBtn}>
                            Редактировать профиль
                        </Link>
                        <Link href="/settings" className={styles.settingsBtn}>
                            <Settings size={20} />
                        </Link>
                    </>
                ) : (
                    <button
                        className={`${styles.followBtn} ${isFollowing ? styles.following : ""}`}
                        onClick={handleFollow}
                    >
                        {isFollowing ? (
                            <>
                                <UserCheck size={18} />
                                <span>Вы подписаны</span>
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                <span>Подписаться</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfileHeader;
