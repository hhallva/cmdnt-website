import React, { useCallback, useMemo, useState } from 'react';
import ActionButton from '../../../components/ActionButton/ActionButton';
import InputField from '../../../components/InputField/InputField';
import Tabs from '../../../components/Tabs/Tabs';
import FurnicheCategoriesTab from './components/FurnicheCategoriesTab';
import FurnicheDistributionTab from './components/FurnicheDistributionTab';
import FurnicheImportTab from './components/FurnicheImportTab';
import FurnicheListTab from './components/FurnicheListTab';
import styles from './Furniche.module.css';

const FurnicheLayout: React.FC = () => {
    const [activeTabId, setActiveTabId] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return 'list';
        }
        return sessionStorage.getItem('furniche-active-tab') || 'list';
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [exportHandler, setExportHandler] = useState<(() => void) | null>(null);

    const handleReset = useCallback(() => {
        setSearchTerm('');
    }, []);

    const handleExport = useCallback(() => {
        exportHandler?.();
    }, [exportHandler]);

    const searchBar = (
        <div className={styles.searchPanelRow}>
            <div className={styles.searchLeft}>
                <div className={styles.searchInputWrapper}>
                    <InputField
                        label=""
                        type="text"
                        placeholder="Поиск..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>
                <div className={styles.searchButtons}>
                    <ActionButton
                        variant="secondary"
                        size="md"
                        onClick={handleReset}
                        className={styles.resetButton}
                    >
                        Сбросить
                    </ActionButton>
                </div>
            </div>
            <div className={styles.searchRight}>
                <ActionButton
                    size="md"
                    variant="primary"
                    onClick={handleExport}
                >
                    <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                    Скачать Excel
                </ActionButton>
            </div>
        </div>
    );

    const tabs = useMemo(() => [
        {
            id: 'list',
            title: 'Список',
            content: (
                <FurnicheListTab />
            ),
        },
        {
            id: 'distribution',
            title: 'Распределение',
            content: (
                <FurnicheDistributionTab />
            ),
        },
        {
            id: 'import',
            title: 'Импорт',
            content: (
                <FurnicheImportTab />
            ),
        },
        {
            id: 'categories',
            title: 'Категории',
            headerContent: searchBar,
            content: (
                <FurnicheCategoriesTab searchTerm={searchTerm} onExportReady={setExportHandler} />
            ),
        },
    ], [searchBar, searchTerm]);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('furniche-active-tab', activeTabId);
        }
    }, [activeTabId]);

    return (
        <section className={styles.container}>
            <Tabs tabs={tabs} activeTabId={activeTabId} onTabChange={setActiveTabId} />
        </section>
    );
};

export default FurnicheLayout;
