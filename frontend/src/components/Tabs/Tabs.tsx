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
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultActiveTabId }) => {
    const [activeTabId, setActiveTabId] = useState<string>(defaultActiveTabId || tabs[0]?.id || '');

    const activeTab = tabs.find(tab => tab.id === activeTabId);
    const activeTabContent = activeTab?.content || null;
    const headerClassName = `${styles.tabsHeader} ${!activeTab?.headerContent ? styles.tabsHeaderCompact : ''}`.trim();

    return (
        <div className={styles.tabsRoot}>
            <div className={styles.tabsSurface}>
                <div className={headerClassName}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`${styles.tabButton} ${activeTabId === tab.id ? styles.active : ''}`}
                            onClick={() => setActiveTabId(tab.id)}
                        >
                            {tab.title}
                        </button>
                    ))}
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