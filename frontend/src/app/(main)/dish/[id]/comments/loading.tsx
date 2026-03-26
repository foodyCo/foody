import styles from "./page.module.css";

export default function Loading() {
    return (
        <div className={styles.container}>
            <div className={styles.overlay}></div>
            <div className={styles.bottomSheet} style={{ transform: 'translateY(0)' }}>
                <div className={styles.handleBar}>
                    <div className={styles.handleLine}></div>
                </div>
                <div className={styles.header}>
                    <h2 className={styles.title}>Комментарии</h2>
                </div>
                <div className={styles.commentList}>
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        Загрузка...
                    </div>
                </div>
            </div>
        </div>
    );
}
