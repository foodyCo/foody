with open('/home/jeka/foodyFront/frontend/src/app/(main)/search/search.module.css', 'r') as f:
    css = f.read()

new_css = """
.searchHeaderContainer {
    position: sticky;
    top: 0;
    background: rgba(245, 246, 248, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 100;
    padding-top: calc(env(safe-area-inset-top, 16px) + 8px);
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0,0,0,0.03);
}

.searchHeader {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 24px;
    margin-bottom: 12px;
}

.searchHeaderWithoutFilters {
    position: sticky;
    top: 0;
    padding: calc(env(safe-area-inset-top, 16px) + 8px) 24px 8px;
    background: rgba(245, 246, 248, 0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 12px;
}

.clearBtn {
    background: rgba(0,0,0,0.05);
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
}

.clearBtn svg {
    width: 12px;
    height: 12px;
    fill: var(--text-secondary, #7A7D85);
}

.quickFilters {
    display: flex;
    gap: 8px;
    padding: 0 24px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.quickFilters::-webkit-scrollbar {
    display: none;
}

.filterChip {
    background: var(--surface, #FFF);
    border: 1px solid rgba(0,0,0,0.05);
    padding: 8px 14px;
    border-radius: 40px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #7A7D85);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}

.filterChipActive {
    background: rgba(46, 204, 113, 0.1);
    border-color: rgba(46, 204, 113, 0.2);
    color: var(--brand-green, #2ecc71);
}

.filterChip svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.resultsMeta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16px;
}

.resultsTitle {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.02em;
}

.resultsCount {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-tertiary, #A0A3AB);
}

.resultsGrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.resultCard {
    background: var(--surface, #FFF);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02);
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: transform 0.2s ease;
    text-decoration: none;
}

.resultCard:active {
    transform: scale(0.97);
}

.cardMedia {
    position: relative;
    aspect-ratio: 1 / 1.1;
    background: #eee;
}

.cardMedia img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.ratingBadge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
    padding: 4px 8px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.ratingBadge svg {
    width: 12px;
    height: 12px;
    fill: #FFC107;
}

.ratingBadge span {
    font-size: 12px;
    font-weight: 800;
    color: var(--text-main, #000);
}

.bookmarkBtn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
}

.bookmarkBtn svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: white;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.bookmarkBtn.saved svg {
    fill: white;
}

.cardInfo {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.dishName {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main, #000);
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.dishPrice {
    font-size: 15px;
    font-weight: 800;
    color: var(--brand-green, #2ecc71);
    margin: 2px 0;
}

.placeMeta {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary, #7A7D85);
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.placeMeta svg {
    width: 12px;
    height: 12px;
    fill: var(--text-tertiary, #A0A3AB);
    flex-shrink: 0;
}

.authorMeta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px solid rgba(0,0,0,0.04);
}

.authorMeta img {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    object-fit: cover;
}

.authorMeta span {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary, #7A7D85);
}
"""

with open('/home/jeka/foodyFront/frontend/src/app/(main)/search/search.module.css', 'a') as f:
    f.write(new_css)
