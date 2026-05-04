import React, { useCallback, useMemo, useState } from 'react';
import ActionButton from '../../../components/ActionButton/ActionButton';
import InputField from '../../../components/InputField/InputField';
import Tabs from '../../../components/Tabs/Tabs';
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
    const [listExportHandler, setListExportHandler] = useState<(() => void) | null>(null);
    const [listSearchTerm, setListSearchTerm] = useState('');
    const [listResetSignal, setListResetSignal] = useState(0);
    const [distributionExportHandler, setDistributionExportHandler] = useState<(() => void) | null>(null);
    const [distributionSearchTerm, setDistributionSearchTerm] = useState('');
    const [distributionResetSignal, setDistributionResetSignal] = useState(0);

    const handleListExport = useCallback(() => {
        listExportHandler?.();
    }, [listExportHandler]);

    const handleListReset = useCallback(() => {
        setListSearchTerm('');
        setListResetSignal(prev => prev + 1);
    }, []);

    const handleDistributionExport = useCallback(() => {
        distributionExportHandler?.();
    }, [distributionExportHandler]);

    const handleDistributionReset = useCallback(() => {
        setDistributionSearchTerm('');
        setDistributionResetSignal(prev => prev + 1);
    }, []);


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

    const distributionHeaderContent = (
        <div className={styles.searchPanelRow}>
            <div className={styles.searchLeft}>
                <div className={styles.searchInputWrapper}>
                    <InputField
                        label=""
                        type="text"
                        placeholder="Поиск..."
                        value={distributionSearchTerm}
                        onChange={(event) => setDistributionSearchTerm(event.target.value)}
                    />
                </div>
                <div className={styles.searchButtons}>
                    <ActionButton
                        variant="secondary"
                        size="md"
                        onClick={handleDistributionReset}
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
                    onClick={handleDistributionExport}
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
                    resetSignal={listResetSignal}
                />
            ),
        },
        {
            id: 'distribution',
            title: 'Распределение',
            headerContent: distributionHeaderContent,
            content: (
                <ExpendableDistributionTab
                    searchTerm={distributionSearchTerm}
                    onExportReady={setDistributionExportHandler}
                    resetSignal={distributionResetSignal}
                />
            ),
        },
    ], [
        distributionHeaderContent,
        distributionSearchTerm,
        listHeaderContent,
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
