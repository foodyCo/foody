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
    
    // JS Swipe state for mouse drag only (desktop)
    const isDrag = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const hasDragged = useRef(false);

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
        isDrag.current = true;
        hasDragged.current = false;
        if (!scrollRef.current) return;
        
        const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
        startX.current = pageX - scrollRef.current.offsetLeft;
        scrollLeft.current = scrollRef.current.scrollLeft;
    };

    const handleMouseLeave = () => {
        isDrag.current = false;
    };

    const handleMouseUp = () => {
        isDrag.current = false;
        snapToClosest();
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
        if (!isDrag.current || !scrollRef.current) return;
        
        const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
        const x = pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX.current) * 1.5;
        
        if (Math.abs(walk) > 5) {
            hasDragged.current = true;
        }
        
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

    const handleCaptureClick = (e: React.MouseEvent) => {
        if (hasDragged.current) {
            e.preventDefault();
            e.stopPropagation();
            hasDragged.current = false;
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
