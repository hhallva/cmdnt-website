import React, { useCallback, useMemo, useState } from 'react';
import ActionButton from '../../../components/ActionButton/ActionButton';
import InputField from '../../../components/InputField/InputField';
import Tabs from '../../../components/Tabs/Tabs';
import ExpendableCategoriesTab from './components/ExpendableCategoriesTab';
import ExpendableDistributionTab from './components/ExpendableDistributionTab';
import ExpendableListTab from './components/ExpendableListTab';
import styles from './Expendable.module.css';

const ExpendableLayout: React.FC = () => {
    const [activeTabId, setActiveTabId] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return 'list';
        }
        return sessionStorage.getItem('expendable-active-tab') || 'list';
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [exportHandler, setExportHandler] = useState<(() => void) | null>(null);
    const [listExportHandler, setListExportHandler] = useState<(() => void) | null>(null);
    const [listSearchTerm, setListSearchTerm] = useState('');

    const handleReset = useCallback(() => {
        setSearchTerm('');
    }, []);

    const handleExport = useCallback(() => {
        exportHandler?.();
    }, [exportHandler]);

    const handleListExport = useCallback(() => {
        listExportHandler?.();
    }, [listExportHandler]);

    const handleListReset = useCallback(() => {
        setListSearchTerm('');
    }, []);

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

    const listHeaderContent = (
        <div className={styles.searchPanelRow}>
            <div className={styles.searchLeft}>
                <div className={styles.searchInputWrapper}>
                    <InputField
                        label=""
                        type="text"
                        placeholder="Поиск..."
                        value={listSearchTerm}
                        onChange={(event) => setListSearchTerm(event.target.value)}
                    />
                </div>
                <div className={styles.searchButtons}>
                    <ActionButton
                        variant="secondary"
                        size="md"
                        onClick={handleListReset}
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
                    onClick={handleListExport}
                    className={styles.exportButton}
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
            headerContent: listHeaderContent,
            content: (
                <ExpendableListTab
                    searchTerm={listSearchTerm}
                    onExportReady={setListExportHandler}
                />
            ),
        },
        {
            id: 'distribution',
            title: 'Распределение',
            content: (
                <ExpendableDistributionTab />
            ),
        },
        {
            id: 'categories',
            title: 'Категории',
            headerContent: searchBar,
            content: (
                <ExpendableCategoriesTab searchTerm={searchTerm} onExportReady={setExportHandler} />
            ),
        },
    ], [
        handleListExport,
        handleListReset,
        listHeaderContent,
        searchBar,
        searchTerm,
        listSearchTerm,
    ]);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('expendable-active-tab', activeTabId);
        }
    }, [activeTabId]);

    return (
        <section className={styles.container}>
            <Tabs tabs={tabs} activeTabId={activeTabId} onTabChange={setActiveTabId} />
        </section>
    );
};

export default ExpendableLayout;
