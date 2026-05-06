import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import CommonTable, { type ColumnDefinition, type RowActionConfig } from '../../../../components/CommonTable/CommonTable';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import InputField from '../../../../components/InputField/InputField';
import SelectField from '../../../../components/SelectField/SelectField';
import inputStyles from '../../../../components/InputField/InputField.module.css';
import { apiClient } from '../../../../api/client';
import type { BuildingDto } from '../../../../types/buildings';
import type { StationaryTypeDto } from '../../../../types/stationaryTypes';
import type { StatusDto } from '../../../../types/statuses';
import type { StationaryEquipmentDto } from '../../../../types/stationaryEquipment';
import styles from '../Furniche.module.css';

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

const columns: ColumnDefinition<StationaryEquipmentDto>[] = [
    {
        key: 'inventoryNumber',
        title: 'Инвентарный номер',
        sortable: true,
        render: (item) => item.inventoryNumber || 'нет',
    },
    {
        key: 'typeName',
        title: 'Категория',
        sortable: true,
        render: (item) => item.typeName || 'нет',
    },
    {
        key: 'description',
        title: 'Описание',
        sortable: true,
        render: (item) => item.description || 'нет',
    },
    {
        key: 'statusName',
        title: 'Статус',
        sortable: true,
        render: (item) => item.statusName || 'нет',
    },
    {
        key: 'buildingName',
        title: 'Здание',
        sortable: true,
        render: (item) => item.roomId ? (item.buildingName || 'нет') : 'На складе',
    },
    {
        key: 'roomNumber',
        title: 'Блок',
        sortable: true,
        render: (item) => item.roomId
            ? `${item.roomNumber || 'нет'} (${item.roomCapacity ?? 'нет'})`
            : 'нет',
    },
];

type FurnicheListTabProps = {
    searchTerm: string;
    selectedBuilding: BuildingFilterValue;
    selectedType: TypeFilterValue;
    selectedStatus: StatusFilterValue;
    onExportReady?: (handler: (() => void) | null) => void;
    onFilterOptionsReady?: (options: ListFilterOptions) => void;
};

const FurnicheListTab: React.FC<FurnicheListTabProps> = ({
    searchTerm,
    selectedBuilding,
    selectedType,
    selectedStatus,
    onExportReady,
    onFilterOptionsReady,
}) => {
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState<StationaryEquipmentDto[]>([]);
    const [buildings, setBuildings] = useState<BuildingDto[]>([]);
    const [types, setTypes] = useState<StationaryTypeDto[]>([]);
    const [statuses, setStatuses] = useState<StatusDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'inventoryNumber',
        direction: 'asc',
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newInventoryNumber, setNewInventoryNumber] = useState('');
    const [newTypeId, setNewTypeId] = useState<number | 'all'>('all');
    const [newStatusId, setNewStatusId] = useState<number | 'all'>('all');
    const [newDescription, setNewDescription] = useState('');
    const [addErrors, setAddErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<StationaryEquipmentDto | null>(null);
    const [editInventoryNumber, setEditInventoryNumber] = useState('');
    const [editTypeId, setEditTypeId] = useState<number | 'all'>('all');
    const [editStatusId, setEditStatusId] = useState<number | 'all'>('all');
    const [editDescription, setEditDescription] = useState('');
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isEditSaving, setIsEditSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [equipmentData, buildingData, typeData, statusData] = await Promise.all([
                apiClient.getStationaryEquipment(),
                apiClient.getAllBuildings(),
                apiClient.getStationaryTypes(),
                apiClient.getStatuses(),
            ]);

            setEquipment(equipmentData);
            setBuildings(buildingData);
            setTypes(typeData);
            setStatuses(statusData);
        } catch (err: any) {
            setError(err?.message || 'Не удалось загрузить список мебели');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const inventoryNumbers = useMemo(() => new Set(
        equipment.map(item => item.inventoryNumber.toUpperCase())
    ), [equipment]);

    const generateInventoryNumber = useCallback((existing: Set<string>) => {
        for (let i = 0; i < 20; i += 1) {
            const candidate = Math.floor(100000 + Math.random() * 900000).toString();
            if (!existing.has(candidate)) {
                return candidate;
            }
        }
        const fallback = Date.now().toString().slice(-6);
        return existing.has(fallback) ? '000000' : fallback;
    }, []);

    const getDefaultStatusId = useCallback(() => {
        if (!statuses.length) {
            return 'all' as const;
        }
        const preferred = statuses.find(status => status.name.toLowerCase() === 'исправно');
        return preferred?.id ?? statuses[0].id;
    }, [statuses]);

    const openAddModal = useCallback(() => {
        const generated = generateInventoryNumber(inventoryNumbers);
        setNewInventoryNumber(generated);
        setNewTypeId('all');
        setNewStatusId(getDefaultStatusId());
        setNewDescription('');
        setAddErrors({});
        setIsAddModalOpen(true);
    }, [generateInventoryNumber, getDefaultStatusId, inventoryNumbers]);

    const closeAddModal = useCallback(() => {
        if (!isSaving) {
            setIsAddModalOpen(false);
        }
    }, [isSaving]);

    const validateAddForm = () => {
        const errors: Record<string, string> = {};
        const trimmed = newInventoryNumber.trim().toUpperCase();

        if (!trimmed) {
            errors.inventoryNumber = 'Поле обязательно';
        } else if (!/^[A-Z0-9]{6}$/.test(trimmed)) {
            errors.inventoryNumber = 'Нужно 6 символов (латиница/цифры)';
        } else if (inventoryNumbers.has(trimmed)) {
            errors.inventoryNumber = 'Такой номер уже есть';
        }

        if (newTypeId === 'all') {
            errors.typeId = 'Выберите категорию';
        }

        if (newStatusId === 'all') {
            errors.statusId = 'Выберите статус';
        }

        if (newDescription && newDescription.length > 300) {
            errors.description = 'Максимум 300 символов';
        }

        setAddErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateAddForm()) {
            return;
        }

        setIsSaving(true);
        try {
            await apiClient.createStationaryEquipment({
                inventoryNumber: newInventoryNumber.trim().toUpperCase(),
                typeId: Number(newTypeId),
                statusId: Number(newStatusId),
                description: newDescription.trim() || null,
            });
            setIsAddModalOpen(false);
            await loadData();
        } catch (err: any) {
            setAddErrors(prev => ({
                ...prev,
                inventoryNumber: err?.message || 'Не удалось сохранить',
            }));
        } finally {
            setIsSaving(false);
        }
    };

    const openEditModal = useCallback((item: StationaryEquipmentDto) => {
        setEditTarget(item);
        setEditInventoryNumber(item.inventoryNumber ?? '');
        setEditTypeId(item.typeId ?? 'all');
        setEditStatusId(item.statusId ?? 'all');
        setEditDescription(item.description ?? '');
        setEditErrors({});
        setIsEditModalOpen(true);
    }, []);

    const closeEditModal = useCallback(() => {
        if (!isEditSaving) {
            setIsEditModalOpen(false);
            setEditTarget(null);
        }
    }, [isEditSaving]);

    const validateEditForm = () => {
        const errors: Record<string, string> = {};
        const trimmed = editInventoryNumber.trim().toUpperCase();
        const normalizedCurrent = editTarget?.inventoryNumber?.toUpperCase();

        if (!trimmed) {
            errors.inventoryNumber = 'Поле обязательно';
        } else if (!/^[A-Z0-9]{6}$/.test(trimmed)) {
            errors.inventoryNumber = 'Нужно 6 символов (латиница/цифры)';
        } else if (trimmed !== normalizedCurrent && inventoryNumbers.has(trimmed)) {
            errors.inventoryNumber = 'Такой номер уже есть';
        }

        if (editTypeId === 'all') {
            errors.typeId = 'Выберите категорию';
        }

        if (editStatusId === 'all') {
            errors.statusId = 'Выберите статус';
        }

        if (editDescription && editDescription.length > 300) {
            errors.description = 'Максимум 300 символов';
        }

        setEditErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editTarget) {
            return;
        }
        if (!validateEditForm()) {
            return;
        }

        setIsEditSaving(true);
        try {
            await apiClient.updateStationaryEquipment(editTarget.id, {
                inventoryNumber: editInventoryNumber.trim().toUpperCase(),
                typeId: Number(editTypeId),
                statusId: Number(editStatusId),
                description: editDescription.trim() || null,
            });
            setIsEditModalOpen(false);
            setEditTarget(null);
            await loadData();
        } catch (err: any) {
            setEditErrors(prev => ({
                ...prev,
                inventoryNumber: err?.message || 'Не удалось сохранить',
            }));
        } finally {
            setIsEditSaving(false);
        }
    };

    const filteredEquipment = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return equipment.filter(item => {
            if (selectedBuilding === 'storage' && item.roomId) {
                return false;
            }
            if (typeof selectedBuilding === 'number' && item.buildingId !== selectedBuilding) {
                return false;
            }
            if (selectedType !== 'all' && item.typeId !== selectedType) {
                return false;
            }
            if (selectedStatus !== 'all' && item.statusId !== selectedStatus) {
                return false;
            }
            if (!term) {
                return true;
            }

            const haystack = [
                item.inventoryNumber,
                item.typeName,
                item.statusName,
                item.buildingName,
                item.roomNumber,
                item.description,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(term);
        });
    }, [equipment, searchTerm, selectedBuilding, selectedStatus, selectedType]);

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

    const sortedEquipment = useMemo(() => {
        const result = [...filteredEquipment];
        if (!sortConfig) {
            return result;
        }

        const { key, direction } = sortConfig;
        const multiplier = direction === 'asc' ? 1 : -1;

        result.sort((a, b) => {
            let aValue = '';
            let bValue = '';

            switch (key) {
                case 'inventoryNumber':
                    aValue = a.inventoryNumber ?? '';
                    bValue = b.inventoryNumber ?? '';
                    break;
                case 'typeName':
                    aValue = a.typeName ?? '';
                    bValue = b.typeName ?? '';
                    break;
                case 'description':
                    aValue = a.description ?? '';
                    bValue = b.description ?? '';
                    break;
                case 'statusName':
                    aValue = a.statusName ?? '';
                    bValue = b.statusName ?? '';
                    break;
                case 'buildingName':
                    aValue = a.roomId ? (a.buildingName ?? '') : 'На складе';
                    bValue = b.roomId ? (b.buildingName ?? '') : 'На складе';
                    break;
                case 'roomNumber':
                    aValue = a.roomNumber ?? '';
                    bValue = b.roomNumber ?? '';
                    break;
                default:
                    return 0;
            }

            const left = aValue.toString().toLowerCase();
            const right = bValue.toString().toLowerCase();

            if (left < right) return -1 * multiplier;
            if (left > right) return 1 * multiplier;
            return 0;
        });

        return result;
    }, [filteredEquipment, sortConfig]);

    const handleEditEquipment = useCallback((item: StationaryEquipmentDto) => {
        openEditModal(item);
    }, [openEditModal]);

    const handleDeleteEquipment = useCallback(async (item: StationaryEquipmentDto) => {
        if (!window.confirm(`Удалить оборудование ${item.inventoryNumber}?`)) {
            return;
        }
        try {
            await apiClient.deleteStationaryEquipment(item.id);
            await loadData();
        } catch (err: any) {
            alert(err?.message || 'Не удалось удалить');
        }
    }, [loadData]);

    const handleReturnToStorage = useCallback(async (item: StationaryEquipmentDto) => {
        if (!window.confirm(`Вернуть оборудование ${item.inventoryNumber} на склад?`)) {
            return;
        }
        if (!item.roomId) {
            alert('Оборудование уже находится на складе');
            return;
        }
        try {
            await apiClient.evictStationaryEquipment(item.id, item.roomId);
            await loadData();
        } catch (err: any) {
            alert(err?.message || 'Не удалось вернуть на склад');
        }
    }, [loadData]);

    const handlePlaceNavigate = useCallback((item: StationaryEquipmentDto) => {
        let targetBuildingId: number | null = null;
        if (typeof window !== 'undefined') {
            const storedActiveBuilding = sessionStorage.getItem('active-building');
            if (storedActiveBuilding) {
                try {
                    const parsed = JSON.parse(storedActiveBuilding) as { id?: number };
                    if (typeof parsed?.id === 'number') {
                        targetBuildingId = parsed.id;
                    }
                } catch {
                    targetBuildingId = null;
                }
            }
        }

        if (targetBuildingId) {
            navigate(`/dashboard/accomodation/${targetBuildingId}`, {
                state: {
                    furnitureEquipmentId: item.id,
                },
            });
            return;
        }

        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pending-furniture-equipment', item.id.toString());
        }
        navigate('/dashboard/accomodation');
    }, [buildings, navigate]);

    const rowAction = useMemo<RowActionConfig<StationaryEquipmentDto>>(() => ({
        icon: 'bi-three-dots-vertical',
        title: 'Действия',
        popupActions: [
            {
                label: 'Разместить',
                icon: 'bi-box-arrow-in-right',
                onClick: handlePlaceNavigate,
                isVisible: (item) => !item.roomId,
            },
            {
                label: 'Вернуть на склад',
                icon: 'bi-box-arrow-left',
                onClick: handleReturnToStorage,
                isVisible: (item) => Boolean(item.roomId),
            },
            {
                label: 'Редактировать',
                icon: 'bi-pencil',
                onClick: handleEditEquipment,
            },
            {
                label: 'Удалить',
                icon: 'bi-trash',
                variant: 'danger',
                onClick: handleDeleteEquipment,
            },
        ],
    }), [handleDeleteEquipment, handleEditEquipment, handlePlaceNavigate, handleReturnToStorage]);

    const handleExport = useCallback(() => {
        const headerRow = ['Инвентарный номер', 'Тип', 'Статус', 'Здание', 'Блок', 'Описание'];
        const bodyRows = filteredEquipment.map(item => ([
            item.inventoryNumber || '',
            item.typeName || '',
            item.statusName || '',
            item.roomId ? (item.buildingName || '') : 'На складе',
            item.roomId ? (item.roomNumber || '') : '',
            item.description || '',
        ]));

        const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Мебель');
        XLSX.writeFile(workbook, `Список_мебели_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }, [filteredEquipment]);

    useEffect(() => {
        onExportReady?.(() => handleExport);
        return () => {
            onExportReady?.(null);
        };
    }, [handleExport, onExportReady]);

    const buildingOptions = useMemo(() => [
        { value: 'all', label: 'Все здания' },
        ...buildings.map(building => ({
            value: building.id,
            label: building.name || `Здание ${building.id}`,
        })),
        { value: 'storage', label: 'На складе' },
    ], [buildings]);


    const typeOptions = useMemo(() => [
        { value: 'all', label: 'Все категории' },
        ...types.map(type => ({ value: type.id, label: type.name || `Категория ${type.id}` })),
    ], [types]);

    const typeOptionsForForm = useMemo(() => [
        { value: 'all', label: 'Выберите категорию' },
        ...types.map(type => ({ value: type.id, label: type.name || `Категория ${type.id}` })),
    ], [types]);

    const statusOptions = useMemo(() => [
        { value: 'all', label: 'Все статусы' },
        ...statuses.map(status => ({ value: status.id, label: status.name || `Статус ${status.id}` })),
    ], [statuses]);

    const statusOptionsForForm = useMemo(() => [
        { value: 'all', label: 'Выберите статус' },
        ...statuses.map(status => ({ value: status.id, label: status.name || `Статус ${status.id}` })),
    ], [statuses]);

    useEffect(() => {
        onFilterOptionsReady?.({
            buildingOptions,
            typeOptions,
            statusOptions,
        });
    }, [buildingOptions, onFilterOptionsReady, statusOptions, typeOptions]);

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
                        ? `Всего: ${filteredEquipment.length} из ${equipment.length}`
                        : `Всего: ${equipment.length}`}
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
            <CommonModal
                title="Новое оборудование"
                isOpen={isAddModalOpen}
                onClose={closeAddModal}
                minWidth={560}
            >
                <form onSubmit={handleAddSubmit} className={styles.modalForm}>
                    <InputField
                        label="Инвентарный номер"
                        type="text"
                        value={newInventoryNumber}
                        onChange={(event) => {
                            const next = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                            setNewInventoryNumber(next);
                            if (addErrors.inventoryNumber) {
                                setAddErrors(prev => ({ ...prev, inventoryNumber: '' }));
                            }
                        }}
                        error={addErrors.inventoryNumber}
                        inputMode="numeric"
                        maxLength={6}
                        disabled={isSaving}
                    />
                    <div className={styles.modalRow}>
                        <SelectField
                            label="Категория"
                            value={newTypeId}
                            onChange={(event) => {
                                const value = event.target.value;
                                setNewTypeId(value === 'all' ? 'all' : Number(value));
                                if (addErrors.typeId) {
                                    setAddErrors(prev => ({ ...prev, typeId: '' }));
                                }
                            }}
                            options={typeOptionsForForm}
                            error={addErrors.typeId}
                            disabled={isSaving}
                        />
                        <SelectField
                            label="Статус"
                            value={newStatusId}
                            onChange={(event) => {
                                const value = event.target.value;
                                setNewStatusId(value === 'all' ? 'all' : Number(value));
                                if (addErrors.statusId) {
                                    setAddErrors(prev => ({ ...prev, statusId: '' }));
                                }
                            }}
                            options={statusOptionsForForm}
                            error={addErrors.statusId}
                            disabled={isSaving}
                        />
                    </div>
                    <div className={inputStyles.formGroup}>
                        <div className={inputStyles.labelRow}>
                            <label className={inputStyles.formLabel}>Описание</label>
                            {addErrors.description && (
                                <span className={inputStyles.inlineError}>{addErrors.description}</span>
                            )}
                        </div>
                        <textarea
                            className={inputStyles.formTextarea}
                            value={newDescription}
                            onChange={(event) => {
                                setNewDescription(event.target.value);
                                if (addErrors.description) {
                                    setAddErrors(prev => ({ ...prev, description: '' }));
                                }
                            }}
                            disabled={isSaving}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <ActionButton size="md" variant="primary" type="submit" disabled={isSaving}>
                            {isSaving ? 'Сохраняем…' : 'Добавить'}
                        </ActionButton>
                    </div>
                </form>
            </CommonModal>
            <CommonModal
                title="Редактировать оборудование"
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                minWidth={560}
            >
                <form onSubmit={handleEditSubmit} className={styles.modalForm}>
                    <InputField
                        label="Инвентарный номер"
                        type="text"
                        value={editInventoryNumber}
                        onChange={(event) => {
                            const next = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                            setEditInventoryNumber(next);
                            if (editErrors.inventoryNumber) {
                                setEditErrors(prev => ({ ...prev, inventoryNumber: '' }));
                            }
                        }}
                        error={editErrors.inventoryNumber}
                        inputMode="numeric"
                        maxLength={6}
                        disabled={isEditSaving}
                    />
                    <div className={styles.modalRow}>
                        <SelectField
                            label="Категория"
                            value={editTypeId}
                            onChange={(event) => {
                                const value = event.target.value;
                                setEditTypeId(value === 'all' ? 'all' : Number(value));
                                if (editErrors.typeId) {
                                    setEditErrors(prev => ({ ...prev, typeId: '' }));
                                }
                            }}
                            options={typeOptionsForForm}
                            error={editErrors.typeId}
                            disabled={isEditSaving}
                        />
                        <SelectField
                            label="Статус"
                            value={editStatusId}
                            onChange={(event) => {
                                const value = event.target.value;
                                setEditStatusId(value === 'all' ? 'all' : Number(value));
                                if (editErrors.statusId) {
                                    setEditErrors(prev => ({ ...prev, statusId: '' }));
                                }
                            }}
                            options={statusOptionsForForm}
                            error={editErrors.statusId}
                            disabled={isEditSaving}
                        />
                    </div>
                    <div className={inputStyles.formGroup}>
                        <div className={inputStyles.labelRow}>
                            <label className={inputStyles.formLabel}>Описание</label>
                            {editErrors.description && (
                                <span className={inputStyles.inlineError}>{editErrors.description}</span>
                            )}
                        </div>
                        <textarea
                            className={inputStyles.formTextarea}
                            value={editDescription}
                            onChange={(event) => {
                                setEditDescription(event.target.value);
                                if (editErrors.description) {
                                    setEditErrors(prev => ({ ...prev, description: '' }));
                                }
                            }}
                            disabled={isEditSaving}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <ActionButton size="md" variant="primary" type="submit" disabled={isEditSaving}>
                            {isEditSaving ? 'Сохраняем…' : 'Сохранить'}
                        </ActionButton>
                    </div>
                </form>
            </CommonModal>
            <CommonTable
                data={sortedEquipment}
                columns={columns}
                rowAction={rowAction}
                enableSorting={true}
                onSortRequest={requestSort}
                sortConfig={sortConfig}
                emptyMessage="Мебель не найдена"
            />
        </div>
    );
};

export default FurnicheListTab;
