// src/components/Tabs/Tabs.tsx
import React, { useState } from 'react';
import styles from './Tabs.module.css'; // Подключим стили для табов

interface TabDefinition {
    id: string;
    title: string;
    content: React.ReactNode; // Основное содержимое вкладки (вторая область)
    headerContent?: React.ReactNode; // Дополнительная область поверх подложки (поисковые панели, фильтры)
}

interface TabsProps {
    tabs: TabDefinition[];
    defaultActiveTabId?: string; // ID активной вкладки по умолчанию
    activeTabId?: string;
    onTabChange?: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultActiveTabId, activeTabId: controlledActiveTabId, onTabChange }) => {
    const [uncontrolledActiveTabId, setUncontrolledActiveTabId] = useState<string>(() => defaultActiveTabId || tabs[0]?.id || '');
    const isControlled = typeof controlledActiveTabId === 'string' && controlledActiveTabId.length > 0;
    const activeTabId = isControlled ? controlledActiveTabId : uncontrolledActiveTabId;

    const handleTabClick = (tabId: string) => {
        if (!isControlled) {
            setUncontrolledActiveTabId(tabId);
        }
        onTabChange?.(tabId);
    };

    const activeTab = tabs.find(tab => tab.id === activeTabId) ?? tabs[0];
    const activeTabContent = activeTab?.content || null;
    const headerClassName = `${styles.tabsHeader} ${!activeTab?.headerContent ? styles.tabsHeaderCompact : ''}`.trim();

    return (
        <div className={styles.tabsRoot}>
            <div className={styles.tabsSurface}>
                <div className={styles.tabsHeaderWrapper}>
                    <div className={headerClassName} role="tablist">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTabId === tab.id}
                                className={`${styles.tabButton} ${activeTabId === tab.id ? styles.active : ''}`}
                                onClick={() => handleTabClick(tab.id)}
                            >
                                {tab.title}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab?.headerContent && (
                    <div className={styles.headerExtras}>
                        {activeTab.headerContent}
                    </div>
                )}
            </div>

            <div className={styles.contentArea}>
                {activeTabContent}
            </div>
        </div>
    );
};

export default Tabs;