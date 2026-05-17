import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ActionButton from '../../../components/ActionButton/ActionButton';
import InputField from '../../../components/InputField/InputField';
import SelectField from '../../../components/SelectField/SelectField';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import Tabs from '../../../components/Tabs/Tabs';
import { stationaryQueryKeys, useStationaryEquipmentStatisticsQuery } from '../../../hooks/useStationaryQuery';
import FurnicheCategoriesTab from './components/FurnicheCategoriesTab';
import FurnicheImportTab from './components/FurnicheImportTab';
import FurnicheListTab from './components/FurnicheListTab';
import styles from './Furniche.module.css';

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

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};

const FurnicheLayout: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTabId, setActiveTabId] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return 'list';
        }
        return sessionStorage.getItem('furniche-active-tab') || 'list';
    });
    const [categoriesSearchTerm, setCategoriesSearchTerm] = useState('');
    const [categoriesExportHandler, setCategoriesExportHandler] = useState<(() => void) | null>(null);

    const [listSearchTerm, setListSearchTerm] = useState('');
    const [listPage, setListPage] = useState(1);
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
    const { data: statistics, isLoading: statsLoading, error: statsError } = useStationaryEquipmentStatisticsQuery();
    const statsErrorMessage = statsError ? getErrorMessage(statsError, 'Не удалось загрузить статистику мебели') : null;

    const handleCategoryReset = useCallback(() => {
        setCategoriesSearchTerm('');
    }, []);

    const handleCategoryExport = useCallback(() => {
        categoriesExportHandler?.();
    }, [categoriesExportHandler]);

    const handleListReset = useCallback(() => {
        setListPage(1);
        setListSearchTerm('');
        setSelectedBuilding('all');
        setSelectedType('all');
        setSelectedStatus('all');
    }, []);

    const handleListSearchChange = useCallback((value: string) => {
        setListPage(1);
        setListSearchTerm(value);
    }, []);

    const handleBuildingChange = useCallback((value: BuildingFilterValue) => {
        setListPage(1);
        setSelectedBuilding(value);
    }, []);

    const handleTypeChange = useCallback((value: TypeFilterValue) => {
        setListPage(1);
        setSelectedType(value);
    }, []);

    const handleStatusChange = useCallback((value: StatusFilterValue) => {
        setListPage(1);
        setSelectedStatus(value);
    }, []);

    const handleListExport = useCallback(() => {
        listExportHandler?.();
    }, [listExportHandler]);

    const handleImportComplete = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: stationaryQueryKeys.all });
    }, [queryClient]);

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
                            onChange={(event) => handleListSearchChange(event.target.value)}
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
                                    handleBuildingChange(value);
                                    return;
                                }
                                handleBuildingChange(Number(value));
                            }}
                            options={listFilterOptions.buildingOptions}
                        />
                        <SelectField
                            label="Тип"
                            value={selectedType}
                            onChange={(event) => {
                                const value = event.target.value;
                                handleTypeChange(value === 'all' ? 'all' : Number(value));
                            }}
                            options={listFilterOptions.typeOptions}
                        />
                        <SelectField
                            label="Статус"
                            value={selectedStatus}
                            onChange={(event) => {
                                const value = event.target.value;
                                handleStatusChange(value === 'all' ? 'all' : Number(value));
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
                    currentPage={listPage}
                    selectedBuilding={selectedBuilding}
                    selectedType={selectedType}
                    selectedStatus={selectedStatus}
                    onPageChange={setListPage}
                    onExportReady={setListExportHandler}
                    onFilterOptionsReady={setListFilterOptions}
                />
            ),
        },
        {
            id: 'import',
            title: 'Импорт мебели',
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
                <div className="alert alert-danger m-3">{statsErrorMessage}</div>
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
