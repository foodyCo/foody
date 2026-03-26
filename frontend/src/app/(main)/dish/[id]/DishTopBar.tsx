"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Props {
  dishTitle: string;
}

export default function DishTopBar({ dishTitle }: Props) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: dishTitle,
        url: window.location.href,
      });
    }
  };

  return (
    <header className={styles.topAppBar}>
      <button className={styles.iconBtn} onClick={handleBack}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
      </button>
      <div className={styles.appBarTitle}>
        {dishTitle.length > 20 ? dishTitle.substring(0, 20) + "..." : dishTitle}
      </div>
      <button className={styles.iconBtn} onClick={handleShare}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>share</span>
      </button>
    </header>
  );
}
