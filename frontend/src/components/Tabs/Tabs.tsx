// src/components/Tabs/Tabs.tsx
import React, { useState } from 'react';
import styles from './Tabs.module.css'; // Подключим стили для табов

interface TabDefinition {
    id: string;
    title: string;
    content: React.ReactNode; // Содержимое вкладки
}

interface TabsProps {
    tabs: TabDefinition[];
    defaultActiveTabId?: string; // ID активной вкладки по умолчанию
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultActiveTabId }) => {
    const [activeTabId, setActiveTabId] = useState<string>(defaultActiveTabId || tabs[0]?.id || '');

    const activeTabContent = tabs.find(tab => tab.id === activeTabId)?.content || null;

    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabsHeader}>
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
            <div>
                {activeTabContent}
            </div>
        </div>
    );
};

export default Tabs;