"use client";

import React, { useState, useRef, MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import styles from "./ImageCarousel.module.css";

interface ImageCarouselProps {
    images: string[];
    alt: string;
    isFullScreen?: boolean;
}

export default function ImageCarousel({ images, alt, isFullScreen = false }: ImageCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // JS Swipe state
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const scrollPosition = scrollRef.current.scrollLeft;
        const width = scrollRef.current.offsetWidth;
        const index = Math.round(scrollPosition / width);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
        isDown.current = true;
        if (!scrollRef.current) return;
        
        const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
        startX.current = pageX - scrollRef.current.offsetLeft;
        scrollLeft.current = scrollRef.current.scrollLeft;
    };

    const handleMouseLeave = () => {
        isDown.current = false;
    };

    const handleMouseUp = () => {
        if (!isDown.current) return;
        // Delay resetting isDown to let onClickCapture read the dragging state
        setTimeout(() => {
            isDown.current = false;
        }, 0);
        snapToClosest();
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
        if (!isDown.current || !scrollRef.current) return;
        // Don't preventDefault unconditionally to keep vertical scrolling possible 
        // if user swipes up. But for a pure carousel, we prevent native dragging.
        const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
        const x = pageX - scrollRef.current.offsetLeft;
        
        // Prevent link firing if dragging
        if (Math.abs(x - startX.current) > 5) {
            e.preventDefault();
        }
        
        const walk = (x - startX.current) * 1.5; // scroll speed
        scrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const snapToClosest = () => {
        if (!scrollRef.current) return;
        const width = scrollRef.current.offsetWidth;
        const index = Math.round(scrollRef.current.scrollLeft / width);
        scrollRef.current.scrollTo({
            left: index * width,
            behavior: 'smooth'
        });
    };

    // To prevent clicking the link when user is just dragging
    const handleCaptureClick = (e: React.MouseEvent) => {
        if (isDown.current) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    if (!images || images.length === 0) {
        return (
            <div className={styles.carouselContainer}>
                 <Image src="/placeholder.png" alt={alt} fill className={styles.image} sizes="(max-width: 768px) 100vw, 600px" priority draggable={false} />
            </div>
        );
    }

    if (images.length === 1) {
        return (
            <div className={styles.carouselContainer}>
                 <Image src={images[0]} alt={alt} fill className={styles.image} sizes="(max-width: 768px) 100vw, 600px" priority draggable={false} />
            </div>
        );
    }

    return (
        <div 
            className={styles.carouselContainer} 
            onClickCapture={handleCaptureClick}
        >
            <div 
                className={styles.carouselTrack}
                ref={scrollRef}
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                onTouchMove={handleMouseMove}
            >
                {images.map((src, index) => (
                    <div key={index} className={`${styles.carouselSlide} ${isFullScreen ? styles.fullScreen : ''}`}>
                        <Image
                            src={src}
                            alt={`${alt} - ${index + 1}`}
                            fill
                            sizes={isFullScreen ? "100vw" : "(max-width: 768px) 100vw, 600px"}
                            priority={index === 0}
                            style={{ objectFit: "cover" }}
                            className={styles.image}
                            draggable={false}
                        />
                    </div>
                ))}
            </div>
            <div className={styles.dots}>
                {images.map((_, i) => (
                    <div key={i} className={`${styles.dot} ${i === activeIndex ? styles.activeDot : ''}`} />
                ))}
            </div>
        </div>
    );
}
