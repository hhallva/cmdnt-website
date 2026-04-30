import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import Tabs from '../../../components/Tabs/Tabs';
import { useDormStructureData } from '../../../hooks/useDormStructureData';
import { apiClient } from '../../../api/client';
import type { StudentsDto } from '../../../types/students';
import type { StructureStatisticDto } from '../../../types/structures';
import type { UserSession } from '../../../types/UserSession';
import type { RoomWithOccupants } from './types';
import AddRoomModal from './components/AddRoomModal';
import BlockModal from './components/BlockModal';
import SettlementToast from './components/SettlementToast';
import SideMenuPortal from './components/SideMenuPortal';
import { StructureTabContent, StructureTabHeader } from './components/StructureTab';
import { SettlementTabContent, SettlementTabHeader } from './components/SettlementTab';
import styles from './Structure.module.css';
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
    const [isNotFound, setIsNotFound] = useState(false);

    const isNotFoundMessage = useCallback((message?: string) => {
        const normalized = message?.toLowerCase() ?? '';
        return normalized.includes('не найдено') || normalized.includes('404');
    }, []);

    const markNotFound = useCallback(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('active-building');
        }
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
            sessionStorage.setItem('active-building', JSON.stringify(stateBuilding));
            return;
        }

        const loadBuilding = async () => {
            try {
                const building = await apiClient.getBuildingById(buildingIdNum);
                sessionStorage.setItem('active-building', JSON.stringify({
                    id: building.id,
                    name: building.name,
                    address: building.address,
                }));
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
    const dragImageRef = useRef<HTMLElement | null>(null);
    const sideMenuDragImageRef = useRef<HTMLElement | null>(null);

    const clearDragImage = useCallback((ref: React.MutableRefObject<HTMLElement | null>) => {
        if (ref.current) {
            ref.current.remove();
            ref.current = null;
        }
    }, []);

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

    const availableTabIds = useMemo(
        () => (canManageRooms ? [...STRUCTURE_TAB_IDS] : ['structure']),
        [canManageRooms]
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

    const [unassignedSortConfig, setUnassignedSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'fullName',
        direction: 'asc',
    });

    const requestUnassignedSort = (key: string) => {
        setUnassignedSortConfig(prevConfig => {
            if (prevConfig && prevConfig.key === key) {
                return {
                    key,
                    direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return { key, direction: 'asc' };
        });
    };

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
                const fullName = formatFullName(student) || '—';
                const imageSrc = getStudentImageSrc(student.image);
                return (
                    <div className={styles.fioCell}>
                        <div className={styles.fioAvatar}>
                            {imageSrc ? (
                                <img src={imageSrc} alt={student.surname || 'Фото студента'} />
                            ) : (
                                <span>{getInitials(student) || '—'}</span>
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
            render: (student: StudentsDto) => student.group?.name ?? '—',
        },
        {
            key: 'group.course',
            title: 'Курс',
            sortable: true,
            render: (student: StudentsDto) => student.group?.course ?? '—',
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
            render: (student: StudentsDto) => student.phone ?? '—',
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
        const storedBuilding = typeof window !== 'undefined' ? sessionStorage.getItem('active-building') : null;
        const storedBuildingId = storedBuilding ? (() => {
            try {
                const parsed = JSON.parse(storedBuilding) as { id?: number };
                return typeof parsed?.id === 'number' ? parsed.id : null;
            } catch {
                return null;
            }
        })() : null;
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
            floorNumber: Number(newRoomForm.floorNumber),
            roomNumber: Number(newRoomForm.roomNumber),
            capacity: Number(newRoomForm.capacity),
        };

        setIsCreatingRoom(true);
        try {
            await apiClient.createRoom(payload);
            setIsAddRoomModalOpen(false);
            setNewRoomForm({ floorNumber: '', roomNumber: '', capacity: '' });
            setNewRoomErrors({});
            refetch();
            await loadStructureStats({ silent: true });
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
            refetch();
            await loadStructureStats({ silent: true });
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

    const setDraggingState = useCallback((element: HTMLElement, isDragging: boolean) => {
        if (isDragging) {
            element.setAttribute('data-dragging', 'true');
            element.style.opacity = '1';
            element.style.transform = 'none';
        } else {
            element.removeAttribute('data-dragging');
            element.style.removeProperty('opacity');
            element.style.removeProperty('transform');
        }
    }, []);

    const createDragImage = useCallback((element: HTMLElement) => {
        if (typeof document === 'undefined') {
            return null;
        }
        const rect = element.getBoundingClientRect();
        const width = Math.ceil(rect.width);
        const height = Math.ceil(rect.height);
        const computed = window.getComputedStyle(element);
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.width = `${width}px`;
        clone.style.height = `${height}px`;
        clone.style.position = 'absolute';
        clone.style.top = '-1000px';
        clone.style.left = '-1000px';
        clone.style.opacity = '1';
        clone.style.transform = 'none';
        clone.style.filter = 'none';
        clone.style.backdropFilter = 'none';
        clone.style.boxShadow = 'none';
        clone.style.outline = 'none';
        clone.style.borderRadius = computed.borderRadius;
        clone.style.backgroundColor = computed.backgroundColor;
        clone.style.border = computed.border;
        clone.style.overflow = 'hidden';
        clone.style.maskImage = 'none';
        clone.style.webkitMaskImage = 'none';
        clone.style.pointerEvents = 'none';
        clone.style.boxSizing = 'border-box';
        document.body.appendChild(clone);
        return clone;
    }, []);

    const createSideMenuDragImage = useCallback((student: StudentsDto) => {
        if (typeof document === 'undefined') {
            return null;
        }
        const imageSrc = getStudentImageSrc(student.image);
        const card = document.createElement('div');
        card.className = styles.sideMenuCard;
        card.style.width = '220px';
        card.style.position = 'absolute';
        card.style.top = '-1000px';
        card.style.left = '-1000px';
        card.style.opacity = '1';
        card.style.transform = 'none';
        card.style.filter = 'none';
        card.style.backdropFilter = 'none';
        card.style.boxShadow = 'none';
        card.style.outline = 'none';
        card.style.overflow = 'hidden';
        card.style.pointerEvents = 'none';
        card.style.boxSizing = 'border-box';

        const avatar = document.createElement('div');
        avatar.className = styles.sideMenuAvatar;

        if (imageSrc) {
            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = student.surname || 'Фотография студента';
            avatar.appendChild(img);
        } else {
            const initials = document.createElement('span');
            initials.textContent = getInitials(student) || '—';
            avatar.appendChild(initials);
        }

        const info = document.createElement('div');
        info.className = styles.sideMenuCardInfo;

        const name = document.createElement('p');
        name.className = styles.sideMenuName;
        name.textContent = formatShortName(student);

        const meta = document.createElement('p');
        meta.className = styles.sideMenuMeta;
        meta.textContent = `Группа ${student.group?.name ?? '—'}, ${student.group?.course ?? '—'} курс`;

        info.appendChild(name);
        info.appendChild(meta);

        card.appendChild(avatar);
        card.appendChild(info);

        document.body.appendChild(card);
        return card;
    }, []);

    useEffect(() => {
        return () => {
            clearDragImage(dragImageRef);
            clearDragImage(sideMenuDragImageRef);
        };
    }, [clearDragImage]);

    const handleStudentDragStart = useCallback((event: React.DragEvent<HTMLButtonElement>, studentId: number) => {
        event.dataTransfer.setData('text/plain', studentId.toString());
        event.dataTransfer.setData('application/x-student-id', studentId.toString());
        event.dataTransfer.effectAllowed = 'move';
        setDraggingState(event.currentTarget, true);
        clearDragImage(dragImageRef);
        const dragImage = createDragImage(event.currentTarget);
        if (dragImage) {
            event.dataTransfer.setDragImage(
                dragImage,
                Math.floor(dragImage.offsetWidth / 2),
                Math.floor(dragImage.offsetHeight / 2)
            );
            dragImageRef.current = dragImage;
        }
    }, [clearDragImage, createDragImage, setDraggingState]);

    const handleStudentDragEnd = useCallback((event: React.DragEvent<HTMLButtonElement>) => {
        setDraggingState(event.currentTarget, false);
        clearDragImage(dragImageRef);
    }, [clearDragImage, setDraggingState]);

    const handleAssignedStudentDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, student: StudentsDto) => {
        event.dataTransfer.setData('text/plain', student.id.toString());
        event.dataTransfer.setData('application/x-student-id', student.id.toString());
        event.dataTransfer.effectAllowed = 'move';
        setDraggingState(event.currentTarget, true);
        clearDragImage(sideMenuDragImageRef);
        const dragImage = createSideMenuDragImage(student);
        if (dragImage) {
            event.dataTransfer.setDragImage(
                dragImage,
                Math.floor(dragImage.offsetWidth / 2),
                Math.floor(dragImage.offsetHeight / 2)
            );
            sideMenuDragImageRef.current = dragImage;
        }
    }, [clearDragImage, createSideMenuDragImage, setDraggingState]);

    const handleAssignedStudentDragEnd = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        setDraggingState(event.currentTarget, false);
        clearDragImage(sideMenuDragImageRef);
    }, [clearDragImage, setDraggingState]);

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
            await refetch({ silent: true });
            await loadStructureStats({ silent: true });
        } catch (err: any) {
            setSettlementAlert({ type: 'error', message: err?.message || 'Не удалось заселить студента' });
        }
    }, [canManageRooms, loadStructureStats, refetch, setSettlementAlert, students]);

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

        setSettlementAlert(null);
        try {
            await apiClient.evictStudent(studentId);
            setSettlementAlert({ type: 'success', message: 'Студент успешно выселен' });
            await refetch({ silent: true });
            await loadStructureStats({ silent: true });
        } catch (err: any) {
            setSettlementAlert({ type: 'error', message: err?.message || 'Не удалось выселить студента' });
        }
    }, [canManageRooms, loadStructureStats, refetch, setSettlementAlert, unassignedStudents]);

    const handleCloseBlockModal = useCallback(() => {
        closeBlockModal();
    }, [closeBlockModal]);

    const toggleSideMenu = useCallback(() => {
        setIsSideMenuOpen(prev => !prev);
    }, []);

    const closeSideMenu = useCallback(() => {
        setIsSideMenuOpen(false);
    }, []);


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

    const tabs = canManageRooms
        ? [
            { id: 'structure', title: 'Структура', headerContent: structureHeaderContent, content: structureTabContent },
            { id: SETTLEMENT_TAB_ID, title: 'Расселение', headerContent: settlementHeaderContent, content: settlementTabContent },
        ]
        : [
            { id: 'structure', title: 'Структура', headerContent: structureHeaderContent, content: structureTabContent },
        ];

    return (
        <>
            <SettlementToast alert={settlementAlert} onClose={() => setSettlementAlert(null)} />
            {canManageRooms && (
                <SideMenuPortal
                    isActive={Boolean(activeBlock)}
                    isOpen={isSideMenuOpen}
                    students={unassignedStudentsSorted}
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

                onTabChange={handleTabChange}
            />

            <BlockModal
                activeBlock={activeBlock}
                canManageRooms={canManageRooms}
                deletingRoomId={deletingRoomId}
                onClose={handleCloseBlockModal}
                onDeleteRoom={handleDeleteRoom}
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
