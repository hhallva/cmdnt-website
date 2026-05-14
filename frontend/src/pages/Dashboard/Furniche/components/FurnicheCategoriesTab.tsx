import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonTable, { type ColumnDefinition, type RowActionConfig } from '../../../../components/CommonTable/CommonTable';
import { apiClient } from '../../../../api/client';
import { stationaryQueryKeys, useStationaryTypesQuery } from '../../../../hooks/useStationaryQuery';
import type { StationaryTypeDto } from '../../../../types/stationaryTypes';
import CategoryModal from '../../components/CategoryModal';
import styles from '../Furniche.module.css';

const columns: ColumnDefinition<StationaryTypeDto>[] = [
    {
        key: 'name',
        title: 'Название',
        sortable: true,
        render: (item) => item.name || 'нет',
    },
];

type FurnicheCategoriesTabProps = {
    searchTerm: string;
    onExportReady?: (handler: (() => void) | null) => void;
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};

const FurnicheCategoriesTab: React.FC<FurnicheCategoriesTabProps> = ({ searchTerm, onExportReady }) => {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<StationaryTypeDto | null>(null);
    const [editName, setEditName] = useState('');
    const [editError, setEditError] = useState<string | null>(null);
    const [isEditSaving, setIsEditSaving] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'name',
        direction: 'asc',
    });
    const { data: types = [], isLoading: loading, error: queryError } = useStationaryTypesQuery();
    const error = queryError ? getErrorMessage(queryError, 'Не удалось загрузить типы') : null;

    const refreshStationaryTypes = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: stationaryQueryKeys.all });
    }, [queryClient]);

    const filteredTypes = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) {
            return types;
        }
        return types.filter(type => type.name.toLowerCase().includes(term));
    }, [searchTerm, types]);

    const requestSort = useCallback((key: string) => {
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

    const sortedTypes = useMemo(() => {
        const result = [...filteredTypes];
        if (!sortConfig) {
            return result;
        }

        const { key, direction } = sortConfig;
        const multiplier = direction === 'asc' ? 1 : -1;

        result.sort((a, b) => {
            if (key === 'name') {
                const aValue = (a.name ?? '').toLowerCase();
                const bValue = (b.name ?? '').toLowerCase();
                if (aValue < bValue) return -1 * multiplier;
                if (aValue > bValue) return 1 * multiplier;
            }
            return 0;
        });

        return result;
    }, [filteredTypes, sortConfig]);

    const handleExportToExcel = useCallback(() => {
        const headerRow = ['Название'];
        const bodyRows = filteredTypes.map(type => ([type.name]));

        const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Категории');
        XLSX.writeFile(workbook, `Типы_мебели_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }, [filteredTypes]);

    useEffect(() => {
        onExportReady?.(() => handleExportToExcel);
        return () => {
            onExportReady?.(null);
        };
    }, [handleExportToExcel, onExportReady]);

    const openAddModal = () => {
        setNewName('');
        setNameError(null);
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        if (!isSaving) {
            setIsAddModalOpen(false);
        }
    };

    const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = newName.trim();
        if (!trimmed) {
            setNameError('Введите название');
            return;
        }

        setIsSaving(true);
        setNameError(null);
        try {
            await apiClient.createStationaryType({ name: trimmed });
            setIsAddModalOpen(false);
            setNewName('');
            await refreshStationaryTypes();
        } catch (err: any) {
            setNameError(err?.message || 'Не удалось сохранить');
        } finally {
            setIsSaving(false);
        }
    };

    const openEditModal = useCallback((type: StationaryTypeDto) => {
        setEditTarget(type);
        setEditName(type.name);
        setEditError(null);
        setIsEditModalOpen(true);
    }, []);

    const closeEditModal = useCallback(() => {
        if (!isEditSaving) {
            setIsEditModalOpen(false);
            setEditTarget(null);
        }
    }, [isEditSaving]);

    const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editTarget) {
            return;
        }
        const trimmed = editName.trim();
        if (!trimmed) {
            setEditError('Введите название');
            return;
        }

        setIsEditSaving(true);
        setEditError(null);
        try {
            await apiClient.updateStationaryType(editTarget.id, {
                id: editTarget.id,
                name: trimmed,
            });
            setIsEditModalOpen(false);
            setEditTarget(null);
            await refreshStationaryTypes();
        } catch (err: any) {
            setEditError(err?.message || 'Не удалось сохранить');
        } finally {
            setIsEditSaving(false);
        }
    };

    const handleDeleteType = useCallback(async (type: StationaryTypeDto) => {
        if (!window.confirm(`Удалить категорию "${type.name}"? Все объекты мебели этой категории будут удалены без возможности восстановления.`)) {
            return;
        }
        try {
            await apiClient.deleteStationaryType(type.id);
            await refreshStationaryTypes();
        } catch (err: any) {
            alert(err?.message || 'Не удалось удалить');
        }
    }, [refreshStationaryTypes]);

    const rowAction = useMemo<RowActionConfig<StationaryTypeDto>>(() => ({
        icon: 'bi-three-dots-vertical',
        title: 'Действия',
        popupActions: [
            {
                label: 'Редактировать',
                icon: 'bi-pencil',
                onClick: openEditModal,
            },
            {
                label: 'Удалить',
                icon: 'bi-trash',
                variant: 'danger',
                onClick: handleDeleteType,
            },
        ],
    }), [handleDeleteType, openEditModal]);

    const content = useMemo(() => {
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
                <div className={styles.tableHeaderRow}>
                    <span className={styles.tableTotal}>
                        {searchTerm.trim()
                            ? `Всего: ${filteredTypes.length} из ${types.length}`
                            : `Всего: ${types.length}`}
                    </span>
                    <ActionButton
                        variant="light"
                        size="md"
                        className={styles.addButton}
                        onClick={openAddModal}
                    >
                        <div className={styles.addButtonContent}>
                            <i className="bi bi-plus"></i>
                            <span>Добавить</span>
                        </div>
                    </ActionButton>
                </div>
                <CategoryModal
                    title="Новая категория"
                    isOpen={isAddModalOpen}
                    onClose={closeAddModal}
                    onSubmit={handleAddSubmit}
                    name={newName}
                    nameError={nameError}
                    isSaving={isSaving}
                    onNameChange={(value) => {
                        setNewName(value);
                        if (nameError) {
                            setNameError(null);
                        }
                    }}
                    submitLabel={isSaving ? 'Добавляем…' : 'Добавить'}
                />
                <CategoryModal
                    title="Редактировать категорию"
                    isOpen={isEditModalOpen}
                    onClose={closeEditModal}
                    onSubmit={handleEditSubmit}
                    name={editName}
                    nameError={editError}
                    isSaving={isEditSaving}
                    onNameChange={(value) => {
                        setEditName(value);
                        if (editError) {
                            setEditError(null);
                        }
                    }}
                    submitLabel={isEditSaving ? 'Сохраняем…' : 'Сохранить'}
                />
                <CommonTable
                    data={sortedTypes}
                    columns={columns}
                    rowAction={rowAction}
                    enableSorting={true}
                    onSortRequest={requestSort}
                    sortConfig={sortConfig}
                    emptyMessage="Категории не найдены"
                />
            </div>
        );
    }, [editError, editName, error, isAddModalOpen, isEditModalOpen, isEditSaving, isSaving, nameError, newName, requestSort, rowAction, searchTerm, sortConfig, sortedTypes, types.length]);

    return content;
};

export default FurnicheCategoriesTab;
