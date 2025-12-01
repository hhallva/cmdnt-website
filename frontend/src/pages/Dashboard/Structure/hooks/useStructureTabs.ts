import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { STRUCTURE_TABS_STORAGE_KEY } from '../constants';

export const useStructureTabs = (availableTabIds: string[]) => {
    const navigate = useNavigate();
    const location = useLocation();
    const fallbackTabId = useMemo(() => availableTabIds[0] ?? '', [availableTabIds]);

    const [activeTabId, setActiveTabId] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return fallbackTabId;
        }
        const storedTabId = sessionStorage.getItem(STRUCTURE_TABS_STORAGE_KEY);
        if (storedTabId && availableTabIds.includes(storedTabId)) {
            return storedTabId;
        }
        return fallbackTabId;
    });

    const handleTabChange = (tabId: string) => {
        if (!availableTabIds.includes(tabId)) {
            return;
        }
        setActiveTabId(tabId);
    };

    useEffect(() => {
        if (availableTabIds.includes(activeTabId)) {
            return;
        }
        setActiveTabId(fallbackTabId);
    }, [activeTabId, availableTabIds, fallbackTabId]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        if (!activeTabId) {
            return;
        }
        sessionStorage.setItem(STRUCTURE_TABS_STORAGE_KEY, activeTabId);
    }, [activeTabId]);

    useEffect(() => {
        const state = location.state as { fromSidebar?: boolean } | null;
        if (!state?.fromSidebar) {
            return;
        }

        setActiveTabId(fallbackTabId);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(STRUCTURE_TABS_STORAGE_KEY, fallbackTabId);
        }

        const { fromSidebar, ...restState } = state;
        const nextState = Object.keys(restState).length ? restState : undefined;
        navigate(location.pathname, { replace: true, state: nextState });
    }, [location.pathname, location.state, fallbackTabId, navigate]);

    return {
        activeTabId,
        setActiveTabId,
        handleTabChange,
    };
};
