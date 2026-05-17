import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import CommonTable, { type ColumnDefinition, type RowActionConfig } from '../../../../components/CommonTable/CommonTable';
import InputField from '../../../../components/InputField/InputField';
import { apiClient } from '../../../../api/client';
import type { ExpendableEquipmentDto } from '../../../../types/expendableEquipment';
import styles from '../Expendable.module.css';

type AdjustMode = 'add' | 'subtract';
type SortableKey = 'typeName' | 'totalCount' | 'usedCount' | 'inStockCount';

type ExpendableListTabProps = {
    searchTerm: string;
    onExportReady?: (handler: (() => void) | null) => void;
    resetSignal?: number;
};

const columns: ColumnDefinition<ExpendableEquipmentDto>[] = [
    {
        key: 'typeName',
        title: 'Категория',
        sortable: true,
        render: (item) => item.type?.name || 'нет',
    },
    {
        key: 'totalCount',
        title: 'Количество',
        sortable: true,
        render: (item) => item.totalCount,
    },
    {
        key: 'usedCount',
        title: 'Использовано',
        sortable: true,
        render: (item) => item.usedCount,
    },
    {
        key: 'inStockCount',
        title: 'На складе',
        sortable: true,
        render: (item) => item.inStockCount,
    },
];

const ExpendableListTab: React.FC<ExpendableListTabProps> = ({
    searchTerm,
    onExportReady,
    resetSignal,
}) => {
    const [items, setItems] = useState<ExpendableEquipmentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>({
        key: 'typeName',
        direction: 'asc',
    });
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustMode, setAdjustMode] = useState<AdjustMode>('add');
    const [adjustTarget, setAdjustTarget] = useState<ExpendableEquipmentDto | null>(null);
    const [adjustCount, setAdjustCount] = useState('');
    const [adjustError, setAdjustError] = useState<string | null>(null);
    const [isAdjusting, setIsAdjusting] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const itemsData = await apiClient.getExpendableEquipment();
            setItems(itemsData);
        } catch (err: any) {
            setError(err?.message || 'Не удалось загрузить список расходников');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (resetSignal !== undefined) {
            setSortConfig({ key: 'typeName', direction: 'asc' });
        }
    }, [resetSignal]);

    const filteredItems = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        if (!normalized) {
            return items;
        }
        return items.filter(item => (item.type?.name ?? '').toLowerCase().includes(normalized));
    }, [items, searchTerm]);

    const requestSort = useCallback((key: string) => {
        if (key !== 'typeName' && key !== 'totalCount' && key !== 'usedCount' && key !== 'inStockCount') {
            return;
        }
        setSortConfig(prevConfig => {
            if (prevConfig && prevConfig.key === key) {
                return {
                    key,
                    direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return { key, direction: 'asc' };
        });
    }, []);

    const sortedItems = useMemo(() => {
        const result = [...filteredItems];
        if (!sortConfig) {
            return result;
        }
        const { key, direction } = sortConfig;
        const multiplier = direction === 'asc' ? 1 : -1;

        result.sort((a, b) => {
            switch (key) {
                case 'typeName': {
                    const aValue = (a.type?.name ?? '').toLowerCase();
                    const bValue = (b.type?.name ?? '').toLowerCase();
                    if (aValue < bValue) return -1 * multiplier;
                    if (aValue > bValue) return 1 * multiplier;
                    return 0;
                }
                case 'totalCount':
                    return (a.totalCount - b.totalCount) * multiplier;
                case 'usedCount':
                    return (a.usedCount - b.usedCount) * multiplier;
                case 'inStockCount':
                    return (a.inStockCount - b.inStockCount) * multiplier;
                default:
                    return 0;
            }
        });

        return result;
    }, [filteredItems, sortConfig]);

    const handleExport = useCallback(() => {
        const headerRow = ['Категория', 'Количество', 'Использовано', 'На складе'];
        const bodyRows = filteredItems.map(item => ([
            item.type?.name,
            item.totalCount,
            item.usedCount,
            item.inStockCount,
        ]));

        const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Расходники');
        XLSX.writeFile(workbook, `Расходники_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }, [filteredItems]);

    useEffect(() => {
        onExportReady?.(() => handleExport);
        return () => {
            onExportReady?.(null);
        };
    }, [handleExport, onExportReady]);

    const openAdjustModal = useCallback((mode: AdjustMode, target: ExpendableEquipmentDto) => {
        setAdjustMode(mode);
        setAdjustTarget(target);
        setAdjustCount('');
        setAdjustError(null);
        setIsAdjustModalOpen(true);
    }, []);

    const closeAdjustModal = useCallback(() => {
        if (!isAdjusting) {
            setIsAdjustModalOpen(false);
            setAdjustTarget(null);
        }
    }, [isAdjusting]);

    const handleAdjustSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!adjustTarget) {
            return;
        }

        const parsed = Number.parseInt(adjustCount, 10);
        if (Number.isNaN(parsed) || parsed <= 0) {
            setAdjustError('Введите количество больше 0');
            return;
        }

        if (adjustMode === 'subtract' && parsed > adjustTarget.inStockCount) {
            setAdjustError('На складе недостаточно расходников');
            return;
        }

        setIsAdjusting(true);
        setAdjustError(null);
        try {
            if (adjustMode === 'add') {
                await apiClient.addExpendableEquipment(adjustTarget.type.id, {
                    count: parsed,
                });
            } else {
                await apiClient.subtractExpendableEquipment(adjustTarget.type.id, {
                    count: parsed,
                });
            }
            setIsAdjustModalOpen(false);
            setAdjustTarget(null);
            await loadData();
        } catch (err: any) {
            setAdjustError(err?.message || 'Не удалось сохранить');
        } finally {
            setIsAdjusting(false);
        }
    };

    const rowAction = useMemo<RowActionConfig<ExpendableEquipmentDto>>(() => ({
        icon: 'bi-three-dots-vertical',
        title: 'Действия',
        popupActions: [
            {
                label: 'Добавить',
                icon: 'bi-plus-circle',
                onClick: (item) => openAdjustModal('add', item),
            },
            {
                label: 'Списать',
                icon: 'bi-dash-circle',
                onClick: (item) => openAdjustModal('subtract', item),
            },
        ],
    }), [openAdjustModal]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center my-3">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger m-3">{error}</div>;
    }

    return (
        <div className={styles.tableBlock}>
            <CommonTable
                data={sortedItems}
                columns={columns}
                rowAction={rowAction}
                emptyMessage="Расходники не найдены"
                enableSorting={true}
                onSortRequest={requestSort}
                sortConfig={sortConfig}
            />

            <CommonModal
                title={adjustMode === 'add' ? 'Добавить расходники' : 'Списать расходники'}
                isOpen={isAdjustModalOpen}
                onClose={closeAdjustModal}
                minWidth={420}
            >
                <form onSubmit={handleAdjustSubmit} className={styles.modalForm}>
                    <InputField
                        label="Категория"
                        type="text"
                        value={adjustTarget?.type?.name ?? ''}
                        disabled={true}
                    />
                    <InputField
                        label="Количество"
                        type="number"
                        min={1}
                        step={1}
                        value={adjustCount}
                        onChange={(event) => setAdjustCount(event.target.value)}
                        error={adjustError ?? undefined}
                        disabled={isAdjusting}
                    />
                    <div className={styles.modalActions}>
                        <ActionButton size="md" variant="primary" type="submit" disabled={isAdjusting}>
                            {adjustMode === 'add'
                                ? (isAdjusting ? 'Добавляем…' : 'Добавить')
                                : (isAdjusting ? 'Списываем…' : 'Списать')}
                        </ActionButton>
                    </div>
                </form>
            </CommonModal>
        </div>
    );
};

export default ExpendableListTab;
