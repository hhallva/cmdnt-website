import React, { useEffect, useState } from 'react';
import { getUserSession } from '../../../components/ProtectedRoute';
import Tabs from '../../../components/Tabs/Tabs';

const BUILDINGS_TAB_STORAGE_KEY = 'buildings-active-tab';
const BUILDINGS_DEFAULT_TAB_ID = 'list';

const BuildingsLayout: React.FC = () => {
    const userSession = getUserSession();
    const roleName = userSession?.role?.name?.toLowerCase() ?? '';
    const isAdmin = roleName.includes('администратор');
    const isCommandant = roleName.includes('комендант');
    const shouldShowTabs = isAdmin || !isCommandant;

    const tabs = [
        {
            id: 'list',
            title: 'Список',
            content: <div>Здесь будет отображаться список зданий</div>,
        },
        {
            id: 'create',
            title: 'Новое здание',
            content: <div>Здесь будет форма для создания нового здания</div >,
        },
    ];

    const [activeTabId, setActiveTabId] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return BUILDINGS_DEFAULT_TAB_ID;
        }
        return sessionStorage.getItem(BUILDINGS_TAB_STORAGE_KEY) || BUILDINGS_DEFAULT_TAB_ID;
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        sessionStorage.setItem(BUILDINGS_TAB_STORAGE_KEY, activeTabId);
    }, [activeTabId]);

    const handleTabChange = (tabId: string) => {
        if (tabs.some(tab => tab.id === tabId)) {
            setActiveTabId(tabId);
        }
    };

    return shouldShowTabs ? (
        <Tabs
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={handleTabChange}
        />
    ) : (
        <div>Здесь будет отображаться список зданий</div>
    );
};

export default BuildingsLayout;
