import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ActionButton from '../../../components/ActionButton/ActionButton';
import InputField from '../../../components/InputField/InputField';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import Tabs from '../../../components/Tabs/Tabs';
import { useDormStructureData } from '../../../hooks/useDormStructureData';
import { apiClient } from '../../../api/client';
import type { StudentsDto } from '../../../types/students';
import type { StructureStatisticDto } from '../../../types/structures';
import type { UserSession } from '../../../types/UserSession';
import type { RoomWithOccupants } from './types';
import AddRoomModal from './components/AddRoomModal';
import BeddingDistributionTab from './components/BeddingDistributionTab';
import BlockModal from './components/BlockModal';
import SettlementToast from './components/SettlementToast';
import SideMenuPortal from './components/SideMenuPortal';
import { StructureTabContent, StructureTabHeader } from './components/StructureTab';
import { SettlementTabContent, SettlementTabHeader } from './components/SettlementTab';
import FurnitureTab, { FurnitureTabHeader, useFurnitureTabState } from './components/FurnitureTab';
import styles from './Structure.module.css';
import expendableStyles from '../Expendable/Expendable.module.css';
import {
    formatBirthday,
    formatFullName,
    formatShortName,
    doesRoomMatchStudentGender,
    getGenderLabel,
    getInitials,
    getStatus,
    getStudentGenderLabel,
} from './utils';
import { SETTLEMENT_TAB_ID, STRUCTURE_TAB_IDS } from './constants';
import { useStructureTabs } from './hooks/useStructureTabs';
import { useStructureFilters } from './hooks/useStructureFilters';
import { useSettlementForm } from './hooks/useSettlementForm';
import { getStudentImageSrc } from '../../../utils/students';
import { useSortableConfig } from './hooks/useSortableConfig';
import { StructureSessionStorage } from './services/StructureSessionStorage';
import { DragImageService } from './services/DragImageService';

type NewRoomFormState = {
    floorNumber: string;
    roomNumber: string;
    capacity: string;
};

type NewRoomFormErrors = Partial<Record<keyof NewRoomFormState, string>>;

const StructureLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { buildingId } = useParams<{ buildingId: string }>();
    const buildingIdNum = buildingId ? Number(buildingId) : null;
    const { rooms, students, loading, error, refetch } = useDormStructureData(buildingIdNum ?? undefined);
    const userSessionStr = typeof window !== 'undefined' ? sessionStorage.getItem('userSession') : null;
    const userSession: UserSession | null = userSessionStr ? JSON.parse(userSessionStr) : null;
    const roleName = userSession?.role?.name?.toLowerCase() ?? '';
    const isEducator = roleName.includes('воспитатель');
    const canManageRooms = !isEducator;
    const [isMobileView, setIsMobileView] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
    const [isNotFound, setIsNotFound] = useState(false);

    const isNotFoundMessage = useCallback((message?: string) => {
        const normalized = message?.toLowerCase() ?? '';
        return normalized.includes('не найдено') || normalized.includes('404');
    }, []);

    const markNotFound = useCallback(() => {
        StructureSessionStorage.removeActiveBuilding();
        setIsNotFound(true);
        navigate('/not-found', { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (!buildingIdNum || Number.isNaN(buildingIdNum)) {
            markNotFound();
            return;
        }

        const stateBuilding = (location.state as { building?: { id: number; name: string; address: string } } | null)?.building;
        if (stateBuilding && stateBuilding.id === buildingIdNum) {
            StructureSessionStorage.saveActiveBuilding(stateBuilding);
            return;
        }

        const loadBuilding = async () => {
            try {
                const building = await apiClient.getBuildingById(buildingIdNum);
                StructureSessionStorage.saveActiveBuilding({
                    id: building.id,
                    name: building.name,
                    address: building.address,
                });
            } catch (err: any) {
                if (isNotFoundMessage(err?.message)) {
                    markNotFound();
                    return;
                }
                console.error('Ошибка при загрузке здания:', err);
            }
        };

        loadBuilding();
    }, [buildingIdNum, location.state, isNotFoundMessage, markNotFound]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [structureStats, setStructureStats] = useState<StructureStatisticDto | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
    const [newRoomForm, setNewRoomForm] = useState<NewRoomFormState>({
        floorNumber: '',
        roomNumber: '',
        capacity: '',
    });
    const [newRoomErrors, setNewRoomErrors] = useState<NewRoomFormErrors>({});
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
    const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
    const [beddingSearchTerm, setBeddingSearchTerm] = useState('');
    const [beddingResetSignal, setBeddingResetSignal] = useState(0);
    const [beddingExportHandler, setBeddingExportHandler] = useState<(() => void) | null>(null);
    const dragImageRef = useRef<HTMLElement | null>(null);
    const sideMenuDragImageRef = useRef<HTMLElement | null>(null);
    const lastSoftRefreshAtRef = useRef(0);
    const dragImageService = useMemo(() => new DragImageService(), []);

    const loadStructureStats = useCallback(async (options?: { silent?: boolean }) => {
        if (!buildingIdNum || Number.isNaN(buildingIdNum)) {
            setStructureStats(null);
            setStatsError('Не удалось определить здание для статистики');
            setStatsLoading(false);
            return;
        }

        if (!options?.silent) {
            setStatsLoading(true);
        }
        setStatsError(null);
        try {
            const data = await apiClient.getStructureStatistics(buildingIdNum);
            setStructureStats(data);
        } catch (err: any) {
            const message = err?.message || 'Не удалось загрузить статистику общежития';
            setStatsError(message);
            console.error('Ошибка при загрузке статистики общежития:', err);
        } finally {
            setStatsLoading(false);
        }
    }, [buildingIdNum]);

    useEffect(() => {
        void loadStructureStats();
    }, [loadStructureStats]);

    const refreshStructureView = useCallback(async (options?: { silent?: boolean }) => {
        await Promise.all([
            refetch({ silent: options?.silent }),
            loadStructureStats({ silent: options?.silent }),
        ]);
    }, [loadStructureStats, refetch]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const triggerSoftRefresh = () => {
            const now = Date.now();
            if (now - lastSoftRefreshAtRef.current < 1000) {
                return;
            }

            lastSoftRefreshAtRef.current = now;
            void refreshStructureView({ silent: true });
        };

        const handleWindowFocus = () => {
            if (document.visibilityState === 'visible') {
                triggerSoftRefresh();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                triggerSoftRefresh();
            }
        };

        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [refreshStructureView]);

    const canUseExtendedTabs = canManageRooms && !isMobileView;
    const availableTabIds = useMemo(
        () => {
            if (!canManageRooms) {
                return ['structure'];
            }

            return canUseExtendedTabs
                ? [...STRUCTURE_TAB_IDS]
                : ['structure', SETTLEMENT_TAB_ID];
        },
        [canManageRooms, canUseExtendedTabs]
    );
    const { activeTabId, setActiveTabId, handleTabChange } = useStructureTabs(availableTabIds);

    const {
        roomsById,
        floorOptions,
        blockOptions,
        studentOptions,
        selectedStudentId,
        selectedFloor,
        selectedBlockKey,
        handleFloorFilterChange,
        handleBlockFilterChange,
        handleStudentFilterChange,
        resetFilters,
        floors,
        activeBlock,
        openBlockModal,
        closeBlockModal,
    } = useStructureFilters({ rooms, students });

    const unassignedStudents = useMemo(() => {
        return students.filter(student => student.roomId === null || student.roomId === undefined);
    }, [students]);

    const activateSettlementTab = useCallback(() => {
        setActiveTabId(SETTLEMENT_TAB_ID);
    }, [setActiveTabId]);

    const {
        settlementForm,
        settlementErrors,
        settlementAlert,
        isSettling,
        settlementStudentOptions,
        settlementFloorOptions,
        settlementRoomOptions,
        handleSettlementStudentChange,
        handleSettlementFloorChange,
        handleSettlementRoomChange,
        handleSettlementReset,
        handleSettlementSubmit,
        prefillRoomSelection,
        setSettlementAlert,
        isStudentSelectDisabled,
        isRoomSelectDisabled,
        isSubmitDisabled,
    } = useSettlementForm({
        rooms,
        roomsById,
        unassignedStudents,
        canManageRooms,
        onSuccess: async () => {
            await refetch({ silent: true });
        },
        refreshStatistics: () => loadStructureStats({ silent: true }),
        activateSettlementTab,
    });

    const { sortConfig: unassignedSortConfig, requestSort: requestUnassignedSort } = useSortableConfig(
        { key: 'fullName', direction: 'asc' },
        ['fullName', 'group.name', 'group.course', 'gender', 'phone', 'birthday'] as const
    );

    const unassignedStudentsSorted = useMemo(() => {
        const result = unassignedStudents.slice();
        if (!unassignedSortConfig) {
            return result;
        }

        const { key, direction } = unassignedSortConfig;
        const dirMultiplier = direction === 'asc' ? 1 : -1;

        result.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            switch (key) {
                case 'fullName':
                    aValue = formatFullName(a).toLowerCase();
                    bValue = formatFullName(b).toLowerCase();
                    break;
                case 'group.name':
                    aValue = (a.group?.name ?? '').toLowerCase();
                    bValue = (b.group?.name ?? '').toLowerCase();
                    break;
                case 'group.course':
                    aValue = a.group?.course ?? 0;
                    bValue = b.group?.course ?? 0;
                    break;
                case 'gender':
                    aValue = a.gender ? 1 : 0;
                    bValue = b.gender ? 1 : 0;
                    break;
                case 'phone':
                    aValue = (a.phone ?? '').toLowerCase();
                    bValue = (b.phone ?? '').toLowerCase();
                    break;
                case 'birthday':
                    aValue = a.birthday ? new Date(a.birthday).getTime() : 0;
                    bValue = b.birthday ? new Date(b.birthday).getTime() : 0;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return -1 * dirMultiplier;
            if (aValue > bValue) return 1 * dirMultiplier;
            return 0;
        });

        return result;
    }, [unassignedStudents, unassignedSortConfig]);

    const unassignedColumns = useMemo(() => ([
        {
            key: 'fullName',
            title: 'ФИО',
            sortable: true,
            render: (student: StudentsDto) => {
                const fullName = formatFullName(student) || 'нет';
                const imageSrc = getStudentImageSrc(student.image);
                return (
                    <div className={styles.fioCell}>
                        <div className={styles.fioAvatar}>
                            {imageSrc ? (
                                <img src={imageSrc} alt={student.surname || 'Фото студента'} />
                            ) : (
                                <span>{getInitials(student) || 'нет'}</span>
                            )}
                        </div>
                        <span className={styles.fioText}>{fullName}</span>
                    </div>
                );
            },
        },
        {
            key: 'group.name',
            title: 'Группа',
            sortable: true,
            render: (student: StudentsDto) => student.group?.name ?? 'нет',
        },
        {
            key: 'group.course',
            title: 'Курс',
            sortable: true,
            render: (student: StudentsDto) => student.group?.course ?? 'нет',
            className: styles.tableNumericCell,
        },
        {
            key: 'gender',
            title: 'Пол',
            sortable: true,
            render: (student: StudentsDto) => getStudentGenderLabel(student.gender),
        },
        {
            key: 'phone',
            title: 'Телефон',
            sortable: true,
            render: (student: StudentsDto) => student.phone ?? 'нет',
        },
        {
            key: 'birthday',
            title: 'Дата рождения',
            sortable: true,
            render: (student: StudentsDto) => formatBirthday(student.birthday),
        },
    ]), [navigate]);
    const openAddRoomModal = (floorNumber?: number) => {
        if (!canManageRooms) {
            return;
        }
        setNewRoomForm({
            floorNumber: floorNumber ? floorNumber.toString() : '',
            roomNumber: '',
            capacity: '',
        });
        setNewRoomErrors({});
        setIsAddRoomModalOpen(true);
    };

    const closeAddRoomModal = () => {
        setIsAddRoomModalOpen(false);
        setNewRoomErrors({});
    };

    const handleNewRoomFieldChange = (field: keyof NewRoomFormState, value: string) => {
        setNewRoomForm(prev => ({ ...prev, [field]: value }));
        if (newRoomErrors[field]) {
            setNewRoomErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validateNewRoomForm = () => {
        const errors: NewRoomFormErrors = {};
        (['floorNumber', 'roomNumber', 'capacity'] as Array<keyof NewRoomFormState>).forEach(field => {
            const rawValue = newRoomForm[field].trim();
            if (!rawValue) {
                errors[field] = 'Поле обязательно';
                return;
            }
            const parsed = Number(rawValue);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                errors[field] = 'Введите положительное число';
                return;
            }
            if (field === 'floorNumber' && parsed > 10) {
                errors[field] = 'Максимум 10';
            }
            if (field === 'roomNumber' && parsed > 99) {
                errors[field] = 'Максимум 99';
            }
            if (field === 'capacity' && parsed > 10) {
                errors[field] = 'Максимум 10';
            }
        });

        setNewRoomErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddRoomSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const storedBuildingId = StructureSessionStorage.getActiveBuildingId();
        const activeBuildingId = storedBuildingId ?? buildingIdNum;

        if (!activeBuildingId) {
            alert('Не удалось определить выбранное здание. Попробуйте открыть общежитие заново.');
            return;
        }

        if (!validateNewRoomForm()) {
            return;
        }

        const payload = {
            buildingId: activeBuildingId,
            floor: Number(newRoomForm.floorNumber),
            number: Number(newRoomForm.roomNumber),
            capacity: Number(newRoomForm.capacity),
        };

        setIsCreatingRoom(true);
        try {
            await apiClient.createRoom(payload);
            setIsAddRoomModalOpen(false);
            setNewRoomForm({ floorNumber: '', roomNumber: '', capacity: '' });
            setNewRoomErrors({});
            await refreshStructureView({ silent: true });
        } catch (err: any) {
            console.error('Ошибка при добавлении комнаты:', err);
            alert(err?.message || 'Не удалось добавить комнату');
        } finally {
            setIsCreatingRoom(false);
        }
    };

    const handleDeleteRoom = async (roomId: number, roomLabel: string) => {
        if (!canManageRooms) {
            return;
        }

        const confirmed = window.confirm(
            `Удалить комнату ${roomLabel}? При удалении комнаты все её студенты будут автоматически выселены.`
        );

        if (!confirmed) {
            return;
        }

        setDeletingRoomId(roomId);
        try {
            await apiClient.deleteRoom(roomId);
            await refreshStructureView({ silent: true });
        } catch (err: any) {
            console.error('Ошибка при удалении комнаты:', err);
            alert(err?.message || 'Не удалось удалить комнату');
        } finally {
            setDeletingRoomId(null);
        }
    };

    const handleFreeSlotClick = useCallback((room: RoomWithOccupants) => {
        prefillRoomSelection(room);
        closeBlockModal();
    }, [closeBlockModal, prefillRoomSelection]);

    useEffect(() => {
        return () => {
            dragImageService.cleanup(dragImageRef);
            dragImageService.cleanup(sideMenuDragImageRef);
        };
    }, [dragImageService]);

    const handleStudentDragStart = useCallback((event: React.DragEvent<HTMLButtonElement>, studentId: number) => {
        event.dataTransfer.setData('text/plain', studentId.toString());
        event.dataTransfer.setData('application/x-student-id', studentId.toString());
        event.dataTransfer.effectAllowed = 'move';
        dragImageService.setDraggingState(event.currentTarget, true);
        dragImageService.cleanup(dragImageRef);
        const dragImage = dragImageService.createFromElement(event.currentTarget);
        if (dragImage) {
            event.dataTransfer.setDragImage(
                dragImage,
                Math.floor(dragImage.offsetWidth / 2),
                Math.floor(dragImage.offsetHeight / 2)
            );
            dragImageRef.current = dragImage;
        }
    }, [dragImageService]);

    const handleStudentDragEnd = useCallback((event: React.DragEvent<HTMLButtonElement>) => {
        dragImageService.setDraggingState(event.currentTarget, false);
        dragImageService.cleanup(dragImageRef);
    }, [dragImageService]);

    const handleAssignedStudentDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, student: StudentsDto) => {
        event.dataTransfer.setData('text/plain', student.id.toString());
        event.dataTransfer.setData('application/x-student-id', student.id.toString());
        event.dataTransfer.effectAllowed = 'move';
        dragImageService.setDraggingState(event.currentTarget, true);
        dragImageService.cleanup(sideMenuDragImageRef);
        const dragImage = dragImageService.createStudentCard(
            student,
            {
                sideMenuCard: styles.sideMenuCard,
                sideMenuAvatar: styles.sideMenuAvatar,
                sideMenuCardInfo: styles.sideMenuCardInfo,
                sideMenuName: styles.sideMenuName,
                sideMenuMeta: styles.sideMenuMeta,
            },
            { formatShortName, getInitials }
        );
        if (dragImage) {
            event.dataTransfer.setDragImage(
                dragImage,
                Math.floor(dragImage.offsetWidth / 2),
                Math.floor(dragImage.offsetHeight / 2)
            );
            sideMenuDragImageRef.current = dragImage;
        }
    }, [dragImageService]);

    const handleAssignedStudentDragEnd = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        dragImageService.setDraggingState(event.currentTarget, false);
        dragImageService.cleanup(sideMenuDragImageRef);
    }, [dragImageService]);

    const handleRoomDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const handleSideMenuDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const handleRoomDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>, room: RoomWithOccupants) => {
        event.preventDefault();
        if (!canManageRooms) {
            return;
        }
        const studentIdRaw = event.dataTransfer.getData('application/x-student-id') || event.dataTransfer.getData('text/plain');
        const studentId = Number(studentIdRaw);
        if (!studentIdRaw || Number.isNaN(studentId)) {
            return;
        }

        const student = students.find(item => item.id === studentId);
        if (!student) {
            setSettlementAlert({ type: 'error', message: 'Студент недоступен для заселения' });
            return;
        }

        if (student.roomId === room.id) {
            return;
        }

        if (!doesRoomMatchStudentGender(room, student.gender)) {
            setSettlementAlert({ type: 'error', message: 'Нельзя заселить студента в эту комнату' });
            return;
        }

        setSettlementAlert(null);
        try {
            if (student.roomId && student.roomId !== room.id) {
                await apiClient.evictStudent(studentId);
            }
            await apiClient.assignStudentToRoom(studentId, room.id);
            setSettlementAlert({ type: 'success', message: 'Студент успешно заселён' });
            await refreshStructureView({ silent: true });
        } catch (err: any) {
            setSettlementAlert({ type: 'error', message: err?.message || 'Не удалось заселить студента' });
        }
    }, [canManageRooms, refreshStructureView, setSettlementAlert, students]);

    const handleSideMenuDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!canManageRooms) {
            return;
        }
        const studentIdRaw = event.dataTransfer.getData('application/x-student-id') || event.dataTransfer.getData('text/plain');
        const studentId = Number(studentIdRaw);
        if (!studentIdRaw || Number.isNaN(studentId)) {
            return;
        }

        const isUnassigned = unassignedStudents.some(item => item.id === studentId);
        if (isUnassigned) {
            return;
        }

        const student = students.find(item => item.id === studentId);
        if (!student?.roomId) {
            return;
        }

        setSettlementAlert(null);
        try {
            await apiClient.evictStudent(studentId);
            setSettlementAlert({ type: 'success', message: 'Студент успешно выселен' });
            await refreshStructureView({ silent: true });
        } catch (err: any) {
            setSettlementAlert({ type: 'error', message: err?.message || 'Не удалось выселить студента' });
        }
    }, [canManageRooms, refreshStructureView, setSettlementAlert, students, unassignedStudents]);

    const handleCloseBlockModal = useCallback(() => {
        closeBlockModal();
    }, [closeBlockModal]);

    const toggleSideMenu = useCallback(() => {
        setIsSideMenuOpen(prev => !prev);
    }, []);

    const closeSideMenu = useCallback(() => {
        setIsSideMenuOpen(false);
    }, []);

    useEffect(() => {
        if (isMobileView && isSideMenuOpen) {
            setIsSideMenuOpen(false);
        }
    }, [isMobileView, isSideMenuOpen]);

    const buildingStudents = useMemo(() => {
        const roomIds = new Set(rooms.map(room => room.id));
        return students.filter(student => student.roomId !== null && student.roomId !== undefined && roomIds.has(student.roomId));
    }, [rooms, students]);

    const handleBeddingExport = useCallback(() => {
        beddingExportHandler?.();
    }, [beddingExportHandler]);

    const handleBeddingReset = useCallback(() => {
        setBeddingSearchTerm('');
        setBeddingResetSignal(prev => prev + 1);
    }, []);

    const furnitureTabState = useFurnitureTabState(buildingIdNum ?? null);

    const handleRoomFurnitureClick = useCallback((room: RoomWithOccupants) => {
        furnitureTabState.actions.selectRoomById(room.id);
        setActiveTabId('furniture');
    }, [furnitureTabState.actions, setActiveTabId]);

    useEffect(() => {
        const furnitureEquipmentId = (location.state as { furnitureEquipmentId?: number } | null)?.furnitureEquipmentId;
        if (typeof furnitureEquipmentId !== 'number') {
            return;
        }

        if (!canUseExtendedTabs) {
            setActiveTabId('structure');
            navigate(location.pathname, { replace: true, state: {} });
            return;
        }

        furnitureTabState.actions.selectEquipmentById(furnitureEquipmentId);
        setActiveTabId('furniture');
        navigate(location.pathname, { replace: true, state: {} });
    }, [canUseExtendedTabs, furnitureTabState.actions, location.pathname, location.state, navigate, setActiveTabId]);


    if (isNotFound) {
        return null;
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3" role="alert">
                {error}
            </div>
        );
    }

    const structureHeaderContent = (
        <StructureTabHeader
            studentValue={selectedStudentId === 'all' ? 'all' : selectedStudentId.toString()}
            floorValue={selectedFloor === 'all' ? 'all' : selectedFloor.toString()}
            blockValue={selectedBlockKey}
            studentOptions={studentOptions}
            floorOptions={floorOptions.map(option => ({ value: option.value.toString(), label: option.label }))}
            blockOptions={blockOptions}
            onStudentChange={handleStudentFilterChange}
            onFloorChange={handleFloorFilterChange}
            onBlockChange={handleBlockFilterChange}
            onReset={resetFilters}
        />
    );

    const structureTabContent = (
        <StructureTabContent
            statsLoading={statsLoading}
            statsError={statsError}
            floors={floors}
            canManageRooms={canManageRooms}
            onAddRoom={openAddRoomModal}
            onOpenBlockModal={openBlockModal}
            getStatus={getStatus}
            formatShortName={formatShortName}
            getGenderLabel={getGenderLabel}
        />
    );

    const settlementHeaderContent = (
        <SettlementTabHeader
            form={settlementForm}
            errors={settlementErrors}
            studentOptions={settlementStudentOptions}
            floorOptions={settlementFloorOptions}
            roomOptions={settlementRoomOptions}
            isSettling={isSettling}
            isStudentDisabled={isStudentSelectDisabled}
            isRoomDisabled={isRoomSelectDisabled}
            isSubmitDisabled={isSubmitDisabled}
            onStudentChange={handleSettlementStudentChange}
            onFloorChange={handleSettlementFloorChange}
            onRoomChange={handleSettlementRoomChange}
            onReset={handleSettlementReset}
            onSubmit={handleSettlementSubmit}
        />
    );


    const rowAction = {
        icon: 'bi-arrows-angle-expand',
        title: 'Открыть карточку студента',
        onClick: (student: StudentsDto) => navigate(`/dashboard/students/${student.id}`),
    };
    const handleSettlementStudentSelect = (student: StudentsDto) => {
        handleSettlementStudentChange(student.id.toString());
    };

    const settlementTabContent = (
        <SettlementTabContent
            students={unassignedStudentsSorted}
            columns={unassignedColumns}
            rowAction={rowAction}
            enableSorting={true}
            onSortRequest={requestUnassignedSort}
            sortConfig={unassignedSortConfig}
            formatFullName={formatFullName}
            formatBirthday={formatBirthday}
            getStudentGenderLabel={getStudentGenderLabel}
            onStudentSelect={handleSettlementStudentSelect}
        />
    );

    const beddingHeaderContent = (
        <div className={expendableStyles.searchPanelRow}>
            <div className={expendableStyles.searchLeft}>
                <div className={expendableStyles.searchInputWrapper}>
                    <InputField
                        label=""
                        type="text"
                        placeholder="Поиск..."
                        value={beddingSearchTerm}
                        onChange={(event) => setBeddingSearchTerm(event.target.value)}
                    />
                </div>
                <div className={expendableStyles.searchButtons}>
                    <ActionButton
                        variant="secondary"
                        size="md"
                        onClick={handleBeddingReset}
                        className={expendableStyles.resetButton}
                    >
                        Сбросить
                    </ActionButton>
                </div>
            </div>
            <div className={expendableStyles.searchRight}>
                <ActionButton
                    size="md"
                    variant="primary"
                    onClick={handleBeddingExport}
                    className={expendableStyles.exportButton}
                >
                    <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                    Скачать Excel
                </ActionButton>
            </div>
        </div>
    );

    const furnitureTabContent = (
        <FurnitureTab {...furnitureTabState.contentProps} />
    );

    const furnitureHeaderContent = (
        <FurnitureTabHeader {...furnitureTabState.headerProps} />
    );

    const beddingTabContent = (
        <BeddingDistributionTab
            searchTerm={beddingSearchTerm}
            students={buildingStudents}
            onExportReady={setBeddingExportHandler}
            resetSignal={beddingResetSignal}
        />
    );

    const tabs = canManageRooms
        ? [
            { id: 'structure', title: 'Структура', headerContent: structureHeaderContent, content: structureTabContent },
            { id: SETTLEMENT_TAB_ID, title: 'Расселение', headerContent: settlementHeaderContent, content: settlementTabContent },
            ...(canUseExtendedTabs
                ? [
                    { id: 'furniture', title: 'Мебель', headerContent: furnitureHeaderContent, content: furnitureTabContent },
                    { id: 'bedding', title: 'Постельное', headerContent: beddingHeaderContent, content: beddingTabContent },
                ]
                : []),
        ]
        : [
            { id: 'structure', title: 'Структура', headerContent: structureHeaderContent, content: structureTabContent },
        ];

    const canUseDragAndDrop = canManageRooms && !isMobileView;

    return (
        <>
            <SettlementToast alert={settlementAlert} onClose={() => setSettlementAlert(null)} />
            {canManageRooms && (
                <SideMenuPortal
                    isActive={Boolean(activeBlock)}
                    isOpen={isSideMenuOpen}
                    students={unassignedStudentsSorted}
                    enableDragAndDrop={canUseDragAndDrop}
                    onToggle={toggleSideMenu}
                    onClose={closeSideMenu}
                    onStudentSelect={handleSettlementStudentSelect}
                    onDragStart={handleStudentDragStart}
                    onDragEnd={handleStudentDragEnd}
                    onDragOver={handleSideMenuDragOver}
                    onDrop={handleSideMenuDrop}
                />
            )}

            {canManageRooms && (
                <AddRoomModal
                    isOpen={isAddRoomModalOpen}
                    isCreating={isCreatingRoom}
                    form={newRoomForm}
                    errors={newRoomErrors}
                    onClose={closeAddRoomModal}
                    onFieldChange={handleNewRoomFieldChange}
                    onSubmit={handleAddRoomSubmit}
                />
            )}
            {!statsLoading && !statsError && structureStats && (<StatisticsCard
                stats={[
                    { value: structureStats.totalCopacity, label: 'мест' },
                    { value: structureStats.occupiedCount, label: 'заселено' },
                    { value: structureStats.freeCount, label: 'свободно' },
                    { value: structureStats.studentCount, label: 'всего студентов' },
                ]}
            />
            )}

            <Tabs
                tabs={tabs}
                activeTabId={activeTabId}
                lockToViewportOnMobile
                onTabChange={handleTabChange}
            />

            <BlockModal
                activeBlock={activeBlock}
                canManageRooms={canManageRooms}
                canOpenFurniture={canUseExtendedTabs}
                enableDragAndDrop={canUseDragAndDrop}
                deletingRoomId={deletingRoomId}
                onClose={handleCloseBlockModal}
                onDeleteRoom={handleDeleteRoom}
                onRoomFurnitureClick={handleRoomFurnitureClick}
                onFreeSlotClick={handleFreeSlotClick}
                onRoomDragOver={handleRoomDragOver}
                onRoomDrop={handleRoomDrop}
                onStudentDragStart={handleAssignedStudentDragStart}
                onStudentDragEnd={handleAssignedStudentDragEnd}
                onStudentCardClick={(studentId) => navigate(`/dashboard/students/${studentId}`)}
            />
        </>
    );
};

export default StructureLayout;
