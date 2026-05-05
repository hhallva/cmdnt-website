import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StructureSessionStorage } from '../services/StructureSessionStorage';

export const useStructureTabs = (availableTabIds: string[]) => {
    const navigate = useNavigate();
    const location = useLocation();
    const fallbackTabId = useMemo(() => availableTabIds[0] ?? '', [availableTabIds]);

    const [activeTabId, setActiveTabId] = useState<string>(() => {
        return StructureSessionStorage.getStructureTab(availableTabIds, fallbackTabId);
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
        if (!activeTabId) {
            return;
        }
        StructureSessionStorage.setStructureTab(activeTabId);
    }, [activeTabId]);

    useEffect(() => {
        const state = location.state as { fromSidebar?: boolean } | null;
        if (!state?.fromSidebar) {
            return;
        }

        setActiveTabId(fallbackTabId);
        StructureSessionStorage.setStructureTab(fallbackTabId);

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
