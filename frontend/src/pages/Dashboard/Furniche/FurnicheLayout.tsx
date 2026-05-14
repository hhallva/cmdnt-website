import React, { useCallback, useMemo, useState } from 'react';
import ActionButton from '../../../components/ActionButton/ActionButton';
import InputField from '../../../components/InputField/InputField';
import SelectField from '../../../components/SelectField/SelectField';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import Tabs from '../../../components/Tabs/Tabs';
import { apiClient } from '../../../api/client';
import type { StationaryEquipmentStatisticDto } from '../../../types/stationaryEquipmentStatistic';
import FurnicheCategoriesTab from './components/FurnicheCategoriesTab';
import FurnicheImportTab from './components/FurnicheImportTab';
import FurnicheListTab from './components/FurnicheListTab';
import styles from './Furniche.module.css';

type LoadStatisticsOptions = {
    silent?: boolean;
};

type BuildingFilterValue = number | 'all' | 'storage';
type TypeFilterValue = number | 'all';
type StatusFilterValue = number | 'all';

type FilterOption = {
    value: number | string;
    label: string;
};

type ListFilterOptions = {
    buildingOptions: FilterOption[];
    typeOptions: FilterOption[];
    statusOptions: FilterOption[];
};

const FurnicheLayout: React.FC = () => {
    const [activeTabId, setActiveTabId] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return 'list';
        }
        return sessionStorage.getItem('furniche-active-tab') || 'list';
    });
    const [categoriesSearchTerm, setCategoriesSearchTerm] = useState('');
    const [categoriesExportHandler, setCategoriesExportHandler] = useState<(() => void) | null>(null);

    const [listSearchTerm, setListSearchTerm] = useState('');
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingFilterValue>('all');
    const [selectedType, setSelectedType] = useState<TypeFilterValue>('all');
    const [selectedStatus, setSelectedStatus] = useState<StatusFilterValue>('all');
    const [isFiltersOpen, setIsFiltersOpen] = useState(true);
    const [listExportHandler, setListExportHandler] = useState<(() => void) | null>(null);
    const [listFilterOptions, setListFilterOptions] = useState<ListFilterOptions>({
        buildingOptions: [
            { value: 'all', label: 'Все здания' },
            { value: 'storage', label: 'На складе' },
        ],
        typeOptions: [{ value: 'all', label: 'Все категории' }],
        statusOptions: [{ value: 'all', label: 'Все статусы' }],
    });
    const [statistics, setStatistics] = useState<StationaryEquipmentStatisticDto | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    const loadStatistics = useCallback(async ({ silent = false }: LoadStatisticsOptions = {}) => {
        const shouldShowLoader = !silent;

        if (shouldShowLoader) {
            setStatsLoading(true);
        }
        if (!silent) {
            setStatsError(null);
        }
        try {
            const data = await apiClient.getStationaryEquipmentStatistics();
            setStatistics(data);
        } catch (err: any) {
            if (shouldShowLoader) {
                setStatsError(err?.message || 'Не удалось загрузить статистику мебели');
            }
        } finally {
            if (shouldShowLoader) {
                setStatsLoading(false);
            }
        }
    }, []);

    React.useEffect(() => {
        void loadStatistics();
    }, [loadStatistics]);

    const handleCategoryReset = useCallback(() => {
        setCategoriesSearchTerm('');
    }, []);

    const handleCategoryExport = useCallback(() => {
        categoriesExportHandler?.();
    }, [categoriesExportHandler]);

    const handleListReset = useCallback(() => {
        setListSearchTerm('');
        setSelectedBuilding('all');
        setSelectedType('all');
        setSelectedStatus('all');
    }, []);

    const handleListExport = useCallback(() => {
        listExportHandler?.();
    }, [listExportHandler]);

    const handleImportComplete = useCallback(async () => {
        await loadStatistics({ silent: true });
    }, [loadStatistics]);

    const listHeader = (
        <div className={styles.searchPanel}>
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
                            onClick={() => setIsFiltersOpen((prev) => !prev)}
                            className={`${styles.modilButton} ${styles.filtersButton}`}
                            aria-expanded={isFiltersOpen}
                        >
                            Фильтры
                            <i className={`bi ${isFiltersOpen ? 'bi-chevron-up' : 'bi-chevron-down'} ms-2`}></i>
                        </ActionButton>
                        <ActionButton
                            variant="secondary"
                            size="md"
                            onClick={handleListReset}
                            className={`${styles.modilButton} ${styles.resetButton}`}
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
                        className={styles.fullWidthMobileButton}
                    >
                        <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                        Скачать Excel
                    </ActionButton>
                </div>
            </div>

            {isFiltersOpen && (
                <div className={styles.advancedFiltersPanel}>
                    <div className={styles.filtersGrid}>
                        <SelectField
                            label="Здание"
                            value={selectedBuilding}
                            onChange={(event) => {
                                const value = event.target.value;
                                if (value === 'all' || value === 'storage') {
                                    setSelectedBuilding(value);
                                    return;
                                }
                                setSelectedBuilding(Number(value));
                            }}
                            options={listFilterOptions.buildingOptions}
                        />
                        <SelectField
                            label="Тип"
                            value={selectedType}
                            onChange={(event) => {
                                const value = event.target.value;
                                setSelectedType(value === 'all' ? 'all' : Number(value));
                            }}
                            options={listFilterOptions.typeOptions}
                        />
                        <SelectField
                            label="Статус"
                            value={selectedStatus}
                            onChange={(event) => {
                                const value = event.target.value;
                                setSelectedStatus(value === 'all' ? 'all' : Number(value));
                            }}
                            options={listFilterOptions.statusOptions}
                        />
                    </div>
                </div>
            )}
        </div>
    );

    const categorySearchBar = (
        <div className={styles.searchPanelRow}>
            <div className={styles.searchLeft}>
                <div className={styles.searchInputWrapper}>
                    <InputField
                        label=""
                        type="text"
                        placeholder="Поиск..."
                        value={categoriesSearchTerm}
                        onChange={(event) => setCategoriesSearchTerm(event.target.value)}
                    />
                </div>
                <div className={styles.searchButtons}>
                    <ActionButton
                        variant="secondary"
                        size="md"
                        onClick={handleCategoryReset}
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
                    onClick={handleCategoryExport}
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
            headerContent: listHeader,
            content: (
                <FurnicheListTab
                    searchTerm={listSearchTerm}
                    selectedBuilding={selectedBuilding}
                    selectedType={selectedType}
                    selectedStatus={selectedStatus}
                    onExportReady={setListExportHandler}
                    onFilterOptionsReady={setListFilterOptions}
                />
            ),
        },
        {
            id: 'import',
            title: 'Импорт',
            content: (
                <FurnicheImportTab onImportComplete={handleImportComplete} />
            ),
        },
        {
            id: 'categories',
            title: 'Категории',
            headerContent: categorySearchBar,
            content: (
                <FurnicheCategoriesTab searchTerm={categoriesSearchTerm} onExportReady={setCategoriesExportHandler} />
            ),
        },
    ], [categoriesSearchTerm, categorySearchBar, handleImportComplete, listHeader, listSearchTerm, selectedBuilding, selectedStatus, selectedType]);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('furniche-active-tab', activeTabId);
        }
    }, [activeTabId]);

    return (
        <div>
            {!statsLoading && statsError && (
                <div className="alert alert-danger m-3">{statsError}</div>
            )}
            {!statsLoading && !statsError && statistics && (
                <StatisticsCard
                    stats={[
                        { value: statistics.totalCount, label: 'всего объектов' },
                        { value: statistics.inUseCount, label: 'использовано' },
                        { value: statistics.storageCount, label: 'склад' },
                        { value: statistics.repairCount, label: 'ремонт' },
                    ]}
                />
            )}
            <Tabs tabs={tabs} activeTabId={activeTabId} onTabChange={setActiveTabId} />
        </div>
    );
};

export default FurnicheLayout;
