const fs = require('fs');

const path = 'src/components/FeedItem.tsx';
let data = fs.readFileSync(path, 'utf8');

// Replace standard header 
const newHeader = `<Link href={dish.author?.id === session?.user?.id ? "/profile" : \`/users/\${dish.author?.id}\`} className={styles.authorLink}>
                    <div className={styles.author}>
                        <Image
                            src={dish.author?.avatar || \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${dish.author?.name || 'User'}\`}
                            alt={dish.author?.name || "User"}
                            width={40}
                            height={40}
                            className={styles.avatar}
                        />
                        <div>
                            <h4 className={styles.authorName}>{dish.author?.name || "Unknown User"}</h4>
                        </div>
                    </div>
                </Link>
                <span className={styles.moreIcon}>more_horiz</span>`;

const newTitleRow = `<div>
                        <h3 className={styles.title}>{dish.title}</h3>
                        <div className={styles.restaurantInfo}>
                            <span className={styles.storeIcon}>store</span>
                            <span className={styles.restaurantName}>{dish.restaurant?.name || "Неизвестно"}</span>
                        </div>
                    </div>`;

// Apply these replacements via scripting or directly. We will rewrite it inline instead.
