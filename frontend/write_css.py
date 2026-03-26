import os

css_content = """
.ambientBg {
    position: fixed;
    inset: 0;
    z-index: -2;
    background-color: var(--bg-base, #F5F6F8);
    background-image: 
        radial-gradient(circle at 10% 20%, rgba(46, 204, 113, 0.06) 0%, transparent 40%),
        radial-gradient(circle at 90% 40%, rgba(65, 131, 255, 0.04) 0%, transparent 40%);
    filter: blur(30px);
}

.searchHeader {
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

.headerActionBtn {
    background: none;
    border: none;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
    margin-left: -12px;
}

.headerActionBtn:active {
    transform: scale(0.9);
    opacity: 0.6;
}

.headerActionBtn svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: var(--text-main, #000);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.omnibox {
    display: flex;
    align-items: center;
    background: var(--surface, #FFFFFF);
    height: 52px;
    border-radius: 16px;
    padding: 0 12px;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0,0,0,0.02);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex: 1;
}

.searchHeaderFocusWithin {
    opacity: 0;
    pointer-events: none;
    width: 0;
    margin-right: -12px;
}

.omnibox:focus-within {
    border-color: rgba(46, 204, 113, 0.3);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(46, 204, 113, 0.1);
}

.omniboxIcon {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: var(--text-tertiary, #A0A3AB);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
}

.omnibox:focus-within .omniboxIcon {
    stroke: var(--brand-green, #2ecc71);
}

.omniboxInput {
    flex: 1;
    height: 100%;
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-main, #000);
    padding: 0 10px;
    outline: none;
}

.omniboxInput::placeholder {
    color: var(--text-tertiary, #A0A3AB);
    font-weight: 500;
}

.mapBtn {
    background: rgba(46, 204, 113, 0.1);
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.2s ease;
}

.mapBtn:active {
    background: rgba(46, 204, 113, 0.2);
}

.mapBtn svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: var(--brand-green, #2ecc71);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.mainContent {
    padding: 0 24px calc(env(safe-area-inset-bottom, 16px) + 20px);
    display: flex;
    flex-direction: column;
    gap: 32px;
    overflow-y: auto;
    flex: 1;
}

.sectionHeader {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16px;
}

.sectionTitle {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-main, #000);
}

.sectionAction {
    font-size: 13px;
    font-weight: 700;
    color: var(--brand-green, #2ecc71);
    cursor: pointer;
}

.recentSearches {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.recentItem {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}

.recentIcon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--surface, #FFF);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.02);
}

.recentIcon svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: var(--text-secondary, #7A7D85);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.recentText {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-main, #000);
}

.recentType {
    font-size: 12px;
    color: var(--text-tertiary, #A0A3AB);
    font-weight: 500;
}

.categoriesGrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.categoryChip {
    background: var(--surface, #FFF);
    padding: 14px 16px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0,0,0,0.02);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.categoryChip:active {
    transform: scale(0.95);
    background: var(--brand-green-light, #e8f8f0);
    border-color: rgba(46, 204, 113, 0.2);
}

.categoryEmoji {
    font-size: 22px;
    line-height: 1;
    flex-shrink: 0;
}

.categoryText {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main, #000);
    line-height: 1.2;
}

.hiddenCategory {
    display: none !important;
}

.showMoreBtn {
    background: rgba(46, 204, 113, 0.08);
    border: 1px dashed rgba(46, 204, 113, 0.3);
    box-shadow: none;
    justify-content: center;
}

.showMoreBtn .categoryText {
    color: var(--brand-green, #2ecc71);
}

.showMoreBtn:active {
    background: rgba(46, 204, 113, 0.15);
    transform: scale(0.95);
}

.tagsWrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.trendTag {
    background: var(--surface, #FFF);
    padding: 10px 16px;
    border-radius: 40px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main, #000);
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.03);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
}

.trendTag span {
    color: var(--brand-green, #2ecc71);
    margin-right: 2px;
    font-weight: 800;
}

.trendTag:active {
    transform: scale(0.95);
    background: var(--text-main, #000);
    color: var(--surface, #FFF);
}

.trendTag:active span {
    color: var(--brand-green, #2ecc71);
}

/* Add custom focus within logic to replace JS / header action hiding */
.searchHeader[data-focus="true"] .headerActionBtn {
    opacity: 0;
    pointer-events: none;
    width: 0;
    margin-left: 0;
    margin-right: -12px;
}
"""

with open('/home/jeka/foodyFront/frontend/src/app/(main)/search/search.module.css', 'w') as f:
    f.write(css_content)
