'use client';

import { useState } from 'react';
import styles from './SubscribeButton.module.css';
import { toggleFollow } from '@/app/actions/social';
import { useRouter } from 'next/navigation';

export default function SubscribeButton({ userId, initialIsFollowing, session }: { userId: number | string, initialIsFollowing: boolean, session: any }) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleSubscribe = async () => {
        if (!session) {
            alert("Пожалуйста, войдите, чтобы подписаться.");
            return;
        }

        const newIsFollowing = !isFollowing;
        setIsFollowing(newIsFollowing); // Optimistic UI update
        setLoading(true);

        const res = await toggleFollow(userId, isFollowing);
        if (res?.error) {
            setIsFollowing(!newIsFollowing); // Revert on error
            console.error("Failed to toggle subscription:", res.error);
        } else {
            router.refresh(); // Refresh page data to show new follower count
        }
        setLoading(false);
    };

    return (
        <button 
            className={styles.subscribeBtn} 
            onClick={handleSubscribe} 
            disabled={loading}
            style={{ 
                background: isFollowing ? 'var(--bg-card, #2A2A2A)' : 'var(--brand-green, #2ecc71)', 
                color: 'white', 
                border: isFollowing ? '1px solid var(--border-color, #333)' : 'none',
                opacity: loading ? 0.7 : 1
            }}
        >
            {isFollowing ? 'Отписаться' : 'Подписаться'}
        </button>
    );
}
