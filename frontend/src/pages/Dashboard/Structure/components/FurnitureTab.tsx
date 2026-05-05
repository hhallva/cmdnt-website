import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonTable, { type ColumnDefinition, type RowActionConfig } from '../../../../components/CommonTable/CommonTable';
import SelectField from '../../../../components/SelectField/SelectField';
import { apiClient } from '../../../../api/client';
import type { RoomDto } from '../../../../types/rooms';
import type { StationaryEquipmentDto } from '../../../../types/stationaryEquipment';
import type { StationaryTypeDto } from '../../../../types/stationaryTypes';
import SettlementToast from './SettlementToast';
import styles from '../../Furniche/Furniche.module.css';

type FurnitureTabProps = {
    className?: string;
    assignedEquipment: StationaryEquipmentDto[];
    filteredAssigned: StationaryEquipmentDto[];
    sortedAssigned: StationaryEquipmentDto[];
    selectedRoomId: SelectValue;
    selectedEquipmentId: SelectValue;
    activeBuildingId: number | null;
    storageEquipmentCount: number;
    formErrors: FormErrors;
    searchTerm: string;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    alert: { type: 'success' | 'error'; message: string } | null;
    isSaving: boolean;
    loading: boolean;
    error: string | null;
    onAlertClose: () => void;
    onSearchChange: (value: string) => void;
    onAssign: () => void;
    onSortRequest: (key: string) => void;
    rowAction: RowActionConfig<StationaryEquipmentDto>;
};

type SelectValue = number | 'all';

type FormErrors = {
    room?: string;
    equipment?: string;
};

type SelectOption = { value: number | string; label: string };

export type FurnitureTabHeaderProps = {
    floorOptions: SelectOption[];
    roomOptions: SelectOption[];
    categoryOptions: SelectOption[];
    equipmentOptions: SelectOption[];
    selectedFloor: SelectValue;
    selectedRoomId: SelectValue;
    selectedCategoryId: SelectValue;
    selectedEquipmentId: SelectValue;
    formErrors: FormErrors;
    onFloorChange: (value: SelectValue) => void;
    onRoomChange: (value: SelectValue) => void;
    onCategoryChange: (value: SelectValue) => void;
    onEquipmentChange: (value: SelectValue) => void;
    onReset: () => void;
    onAssign: () => void;
    isAssignDisabled: boolean;
};

type FurnitureTabState = {
    headerProps: FurnitureTabHeaderProps;
    contentProps: FurnitureTabProps;
    actions: {
        selectRoomById: (roomId: number) => void;
        selectEquipmentById: (equipmentId: number) => void;
    };
};

const columns: ColumnDefinition<StationaryEquipmentDto>[] = [
    {
        key: 'inventoryNumber',
        title: 'Инвентарный номер',
        sortable: true,
        render: (item) => item.inventoryNumber || '—',
    },
    {
        key: 'typeName',
        title: 'Категория',
        sortable: true,
        render: (item) => item.typeName || '—',
    },
    {
        key: 'statusName',
        title: 'Статус',
        sortable: true,
        render: (item) => item.statusName || '—',
    },
    {
        key: 'description',
        title: 'Описание',
        sortable: true,
        render: (item) => item.description || '—',
    },
];

const getActiveBuildingId = (): number | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    const stored = sessionStorage.getItem('active-building');
    if (!stored) {
        return null;
    }
    try {
        const parsed = JSON.parse(stored) as { id?: number };
        return typeof parsed?.id === 'number' ? parsed.id : null;
    } catch {
        return null;
    }
};

const getStoredFurnitureSelection = (buildingId: number | null) => {
    if (typeof window === 'undefined' || !buildingId) {
        return null;
    }
    const raw = sessionStorage.getItem(`furniture-selection-${buildingId}`);
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw) as { floor?: number | null; roomId?: number | null };
        return {
            floor: typeof parsed.floor === 'number' ? parsed.floor : 'all',
            roomId: typeof parsed.roomId === 'number' ? parsed.roomId : 'all',
        } as { floor: SelectValue; roomId: SelectValue };
    } catch {
        return null;
    }
};

const setStoredFurnitureSelection = (
    buildingId: number | null,
    floor: SelectValue,
    roomId: SelectValue
) => {
    if (typeof window === 'undefined' || !buildingId) {
        return;
    }
    if (floor === 'all' && roomId === 'all') {
        sessionStorage.removeItem(`furniture-selection-${buildingId}`);
        return;
    }
    sessionStorage.setItem(
        `furniture-selection-${buildingId}`,
        JSON.stringify({
            floor: floor === 'all' ? null : Number(floor),
            roomId: roomId === 'all' ? null : Number(roomId),
        })
    );
};

export const useFurnitureTabState = (buildingIdOverride?: number | null): FurnitureTabState => {
    const [rooms, setRooms] = useState<RoomDto[]>([]);
    const [equipment, setEquipment] = useState<StationaryEquipmentDto[]>([]);
    const [types, setTypes] = useState<StationaryTypeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const activeBuildingId = buildingIdOverride ?? getActiveBuildingId();
    const storedSelection = getStoredFurnitureSelection(activeBuildingId);
    const [selectedFloor, setSelectedFloor] = useState<SelectValue>(storedSelection?.floor ?? 'all');
    const [selectedRoomId, setSelectedRoomId] = useState<SelectValue>(storedSelection?.roomId ?? 'all');
    const [selectedCategoryId, setSelectedCategoryId] = useState<SelectValue>('all');
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<SelectValue>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingEquipmentId, setPendingEquipmentId] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'inventoryNumber',
        direction: 'asc',
    });

    const loadEquipment = useCallback(async () => {
        try {
            const data = await apiClient.getStationaryEquipment();
            setEquipment(data);
        } catch (err: any) {
            setError(err?.message || 'Не удалось загрузить список мебели');
        }
    }, []);

    const loadTypes = useCallback(async () => {
        try {
            const data = await apiClient.getStationaryTypes();
            setTypes(data);
        } catch (err: any) {
            setError(err?.message || 'Не удалось загрузить категории мебели');
        }
    }, []);

    const loadRooms = useCallback(async (buildingId: number) => {
        try {
            const data = await apiClient.getRoomsByBuildingId(buildingId);
            setRooms(data);
        } catch (err: any) {
            setError(err?.message || 'Не удалось загрузить комнаты');
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            await Promise.all([loadEquipment(), loadTypes()]);
            setLoading(false);
        };
        void load();
    }, [loadEquipment, loadTypes]);

    useEffect(() => {
        if (!activeBuildingId) {
            setSelectedFloor('all');
            setSelectedRoomId('all');
            setRooms([]);
            return;
        }
        const nextSelection = getStoredFurnitureSelection(activeBuildingId);
        setSelectedFloor(nextSelection?.floor ?? 'all');
        setSelectedRoomId(nextSelection?.roomId ?? 'all');
        setRooms([]);
        void loadRooms(activeBuildingId);
    }, [activeBuildingId, loadRooms]);

    useEffect(() => {
        setStoredFurnitureSelection(activeBuildingId, selectedFloor, selectedRoomId);
    }, [activeBuildingId, selectedFloor, selectedRoomId]);

    useEffect(() => {
        if (!alert) {
            return undefined;
        }
        const timerId = window.setTimeout(() => {
            setAlert(null);
        }, 3500);
        return () => window.clearTimeout(timerId);
    }, [alert]);

    const floorOptions = useMemo(() => {
        const floors = Array.from(new Set(rooms.map(room => room.floor))).sort((a, b) => a - b);
        const options = floors.map(floor => ({ value: floor, label: `${floor} этаж ` }));
        return [{ value: 'all', label: 'Все этажи' }, ...options];
    }, [rooms]);

    const filteredRooms = useMemo(() => {
        if (selectedFloor === 'all') {
            return rooms;
        }
        return rooms.filter(room => room.floor === Number(selectedFloor));
    }, [rooms, selectedFloor]);

    useEffect(() => {
        if (selectedRoomId === 'all' || rooms.length === 0) {
            return;
        }
        const exists = filteredRooms.some(room => room.id === Number(selectedRoomId));
        if (!exists) {
            setSelectedRoomId('all');
        }
    }, [filteredRooms, rooms.length, selectedRoomId]);

    const roomOptions = useMemo(() => {
        const options = filteredRooms.map(room => ({
            value: room.id,
            label: `${room.number} (${room.capacity})`,
        }));
        return [{ value: 'all', label: 'Выберите комнату' }, ...options];
    }, [filteredRooms]);

    const selectRoomById = useCallback((roomId: number) => {
        const selectedRoom = rooms.find(room => room.id === roomId);
        if (selectedRoom) {
            setSelectedFloor(selectedRoom.floor);
            setSelectedRoomId(selectedRoom.id);
        } else {
            setSelectedRoomId(roomId);
        }
        setFormErrors(prev => ({ ...prev, room: undefined }));
    }, [rooms]);

    const categoryOptions = useMemo(() => {
        const options = types.map(type => ({ value: type.id, label: type.name }));
        return [{ value: 'all', label: 'Все категории' }, ...options];
    }, [types]);

    const storageEquipment = useMemo(
        () => equipment.filter(item => item.roomId === null),
        [equipment]
    );

    const applyEquipmentSelection = useCallback((item: StationaryEquipmentDto) => {
        setSelectedCategoryId(item.typeId);
        setSelectedEquipmentId(item.id);
        setFormErrors(prev => ({ ...prev, equipment: undefined }));
    }, []);

    const filteredStorage = useMemo(() => {
        if (selectedCategoryId === 'all') {
            return storageEquipment;
        }
        return storageEquipment.filter(item => item.typeId === Number(selectedCategoryId));
    }, [selectedCategoryId, storageEquipment]);

    const equipmentOptions = useMemo(() => {
        const options = filteredStorage.map(item => ({
            value: item.id,
            label: `${item.inventoryNumber} • ${item.typeName}${item.statusName ? ` • ${item.statusName}` : ''}`,
        }));
        return [{ value: 'all', label: 'Выберите мебель' }, ...options];
    }, [filteredStorage]);

    const selectEquipmentById = useCallback((equipmentId: number) => {
        const target = storageEquipment.find(item => item.id === equipmentId);
        if (target) {
            applyEquipmentSelection(target);
            setPendingEquipmentId(null);
            return;
        }
        setPendingEquipmentId(equipmentId);
    }, [applyEquipmentSelection, storageEquipment]);

    useEffect(() => {
        if (!pendingEquipmentId) {
            return;
        }
        const target = storageEquipment.find(item => item.id === pendingEquipmentId);
        if (target) {
            applyEquipmentSelection(target);
            setPendingEquipmentId(null);
        }
    }, [applyEquipmentSelection, pendingEquipmentId, storageEquipment]);

    const assignedEquipment = useMemo(() => {
        if (selectedRoomId === 'all') {
            return [];
        }
        return equipment.filter(item => item.roomId === Number(selectedRoomId));
    }, [equipment, selectedRoomId]);

    const filteredAssigned = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) {
            return assignedEquipment;
        }
        return assignedEquipment.filter(item => (
            item.inventoryNumber?.toLowerCase().includes(term)
            || item.typeName?.toLowerCase().includes(term)
            || item.statusName?.toLowerCase().includes(term)
            || (item.description ?? '').toLowerCase().includes(term)
        ));
    }, [assignedEquipment, searchTerm]);

    const requestSort = useCallback((key: string) => {
        const allowedKeys = ['inventoryNumber', 'typeName', 'statusName', 'description'];
        if (!allowedKeys.includes(key)) {
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

    const sortedAssigned = useMemo(() => {
        const result = [...filteredAssigned];
        if (!sortConfig) {
            return result;
        }
        const { key, direction } = sortConfig;
        const multiplier = direction === 'asc' ? 1 : -1;

        result.sort((a, b) => {
            const aValue = (a as any)[key] ?? '';
            const bValue = (b as any)[key] ?? '';
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return aValue.localeCompare(bValue, 'ru', { sensitivity: 'base' }) * multiplier;
            }
            if (aValue < bValue) return -1 * multiplier;
            if (aValue > bValue) return 1 * multiplier;
            return 0;
        });

        return result;
    }, [filteredAssigned, sortConfig]);

    const validateForm = () => {
        const nextErrors: FormErrors = {};
        if (selectedRoomId === 'all') {
            nextErrors.room = 'Выберите комнату';
        }
        if (selectedEquipmentId === 'all') {
            nextErrors.equipment = 'Выберите мебель';
        }
        setFormErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleAssign = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        setAlert(null);
        try {
            await apiClient.assignStationaryEquipmentToRoom(Number(selectedEquipmentId), Number(selectedRoomId));
            setSelectedEquipmentId('all');
            await loadEquipment();
            setAlert({ type: 'success', message: 'Мебель успешно размещена в комнате' });
        } catch (err: any) {
            setAlert({ type: 'error', message: err?.message || 'Не удалось разместить мебель' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEvict = useCallback(async (item: StationaryEquipmentDto) => {
        const confirmed = window.confirm(`Убрать мебель ${item.inventoryNumber} на склад?`);
        if (!confirmed) {
            return;
        }
        setIsSaving(true);
        setAlert(null);
        try {
            await apiClient.evictStationaryEquipment(item.id);
            await loadEquipment();
            setAlert({ type: 'success', message: 'Мебель возвращена на склад' });
        } catch (err: any) {
            setAlert({ type: 'error', message: err?.message || 'Не удалось убрать мебель' });
        } finally {
            setIsSaving(false);
        }
    }, [loadEquipment]);

    const rowAction = useMemo<RowActionConfig<StationaryEquipmentDto>>(() => ({
        icon: 'bi-three-dots-vertical',
        title: 'Действия',
        popupActions: [
            {
                label: 'Убрать на склад',
                icon: 'bi-box-seam',
                variant: 'danger',
                onClick: handleEvict,
            },
        ],
    }), [handleEvict]);

    const handleReset = useCallback(() => {
        setSelectedFloor('all');
        setSelectedRoomId('all');
        setSelectedCategoryId('all');
        setSelectedEquipmentId('all');
        setFormErrors({});
        setStoredFurnitureSelection(activeBuildingId, 'all', 'all');
    }, [activeBuildingId]);

    return {
        headerProps: {
            floorOptions,
            roomOptions,
            categoryOptions,
            equipmentOptions,
            selectedFloor,
            selectedRoomId,
            selectedCategoryId,
            selectedEquipmentId,
            formErrors,
            onFloorChange: setSelectedFloor,
            onRoomChange: setSelectedRoomId,
            onCategoryChange: setSelectedCategoryId,
            onEquipmentChange: setSelectedEquipmentId,
            onReset: handleReset,
            onAssign: handleAssign,
            isAssignDisabled: isSaving || !activeBuildingId,
        },
        contentProps: {
            assignedEquipment,
            filteredAssigned,
            sortedAssigned,
            selectedRoomId,
            selectedEquipmentId,
            activeBuildingId,
            storageEquipmentCount: storageEquipment.length,
            formErrors,
            searchTerm,
            sortConfig,
            alert,
            isSaving,
            loading,
            error,
            onAlertClose: () => setAlert(null),
            onSearchChange: setSearchTerm,
            onAssign: handleAssign,
            onSortRequest: requestSort,
            rowAction,
        },
        actions: {
            selectRoomById,
            selectEquipmentById,
        },
    };
};

export const FurnitureTabHeader: React.FC<FurnitureTabHeaderProps> = ({
    floorOptions,
    roomOptions,
    categoryOptions,
    equipmentOptions,
    selectedFloor,
    selectedRoomId,
    selectedCategoryId,
    selectedEquipmentId,
    formErrors,
    onFloorChange,
    onRoomChange,
    onCategoryChange,
    onEquipmentChange,
    onReset,
    onAssign,
    isAssignDisabled,
}) => (
    <div className={styles.searchPanel}>
        <div className={styles.furnitureHeader}>
            <div className={styles.furnitureFields}>
                <SelectField
                    label="Этаж"
                    value={selectedFloor}
                    onChange={(event) => {
                        const value = event.target.value;
                        onFloorChange(value === 'all' ? 'all' : Number(value));
                    }}
                    options={floorOptions}
                />
                <SelectField
                    label="Комната"
                    value={selectedRoomId}
                    onChange={(event) => {
                        const value = event.target.value;
                        onRoomChange(value === 'all' ? 'all' : Number(value));
                    }}
                    options={roomOptions}
                    error={formErrors.room}
                />
                <SelectField
                    label="Категория"
                    value={selectedCategoryId}
                    onChange={(event) => {
                        const value = event.target.value;
                        onCategoryChange(value === 'all' ? 'all' : Number(value));
                    }}
                    options={categoryOptions}
                />
                <SelectField
                    label="Мебель"
                    value={selectedEquipmentId}
                    onChange={(event) => {
                        const value = event.target.value;
                        onEquipmentChange(value === 'all' ? 'all' : Number(value));
                    }}
                    options={equipmentOptions}
                    error={formErrors.equipment}
                />
            </div>
            <div className={styles.furnitureButtons}>
                <ActionButton
                    variant="secondary"
                    size="md"
                    onClick={onReset}
                    className={styles.resetButton}
                >
                    Сбросить
                </ActionButton>
                <ActionButton
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={onAssign}
                    disabled={isAssignDisabled}
                    className={styles.furnitureAssignButton}
                >
                    Разместить
                </ActionButton>
            </div>
        </div>
    </div>
);

const FurnitureTab: React.FC<FurnitureTabProps> = ({
    className,
    sortedAssigned,
    selectedRoomId,
    sortConfig,
    alert,
    loading,
    error,
    onAlertClose,
    onSortRequest,
    rowAction,
}) => {
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
        <div className={`${styles.container} ${className ?? ''}`.trim()}>
            <SettlementToast alert={alert} onClose={onAlertClose} />
            <div className={styles.tableBlock}>
                <CommonTable
                    data={sortedAssigned}
                    columns={columns}
                    enableSorting={true}
                    onSortRequest={onSortRequest}
                    sortConfig={sortConfig}
                    rowAction={rowAction}
                    emptyMessage={selectedRoomId === 'all' ? 'Выберите комнату' : 'В комнате нет мебели'}
                />
            </div>
        </div>
    );
};

export default FurnitureTab;
