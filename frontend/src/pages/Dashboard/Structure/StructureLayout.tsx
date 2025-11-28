import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import SelectField from '../../../components/SelectField/SelectField';
import ActionButton from '../../../components/ActionButton/ActionButton';
import CommonModal from '../../../components/CommonModal/CommonModal';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import InputField from '../../../components/InputField/InputField';
import Tabs from '../../../components/Tabs/Tabs';
import CommonTable from '../../../components/CommonTable/CommonTable';
import { useDormStructureData } from '../../../hooks/useDormStructureData';
import { apiClient } from '../../../api/client';
import type { RoomDto } from '../../../types/rooms';
import type { StudentsDto } from '../../../types/students';
import type { StructureStatisticDto } from '../../../types/structures';
import type { UserSession } from '../../../types/UserSession';
import styles from './Structure.module.css';

type RoomWithOccupants = RoomDto & { occupants: StudentsDto[] };
type RoomStatus = 'occupied' | 'free' | 'partial';

type BlockWithRooms = {
    blockNumber: string;
    floorNumber: number;
    rooms: RoomWithOccupants[];
    capacity: number;
    currentCapacity: number;
    genderType: RoomWithOccupants['genderType'];
};

type FloorWithBlocks = {
    floor: number;
    blocks: BlockWithRooms[];
    total: number;
    free: number;
};

type NewRoomFormState = {
    floorNumber: string;
    roomNumber: string;
    capacity: string;
};

type NewRoomFormErrors = Partial<Record<keyof NewRoomFormState, string>>;

type SettlementFormState = {
    studentId: string;
    floorNumber: string;
    roomId: string;
};

type SettlementFormErrors = Partial<Record<'studentId' | 'roomId', string>>;

const settlementFormInitialState: SettlementFormState = {
    studentId: '',
    floorNumber: '',
    roomId: '',
};

const STRUCTURE_TABS_STORAGE_KEY = 'structure-active-tab';
const STRUCTURE_TAB_IDS = ['structure', 'settlement'] as const;

const getStatus = (currentCapacity: number, capacity: number): RoomStatus => {
    if (currentCapacity === 0) {
        return 'free';
    }
    if (currentCapacity >= capacity) {
        return 'occupied';
    }
    return 'partial';
};

const getInitials = (student: StudentsDto): string => {
    const initials = `${student.surname?.charAt(0) ?? ''}${student.name?.charAt(0) ?? ''}`;
    return initials || '—';
};

const formatShortName = (student: StudentsDto): string => {
    const surname = student.surname?.trim() ?? '';
    const nameInitial = student.name ? `${student.name.trim().charAt(0)}.` : '';
    const patronymicInitial = student.patronymic ? `${student.patronymic.trim().charAt(0)}.` : '';
    const initials = [nameInitial, patronymicInitial].filter(Boolean).join(' ');
    return [surname, initials].filter(Boolean).join(' ').trim() || `Студент ${student.id}`;
};

export const formatFullName = (student: StudentsDto): string => {
    return [student.surname, student.name, student.patronymic].filter(Boolean).join(' ').trim();
};

const getGenderLabel = (entity: { genderType: RoomWithOccupants['genderType'] }): string => {
    if (entity.genderType === null) {
        return '-';
    }
    return entity.genderType ? 'Мужской' : 'Женский';
};

export const getStudentGenderLabel = (gender: StudentsDto['gender']): string => {
    if (gender === null || gender === undefined) {
        return 'Не указан';
    }
    return gender ? 'Мужской' : 'Женский';
};

export const formatBirthday = (birthday?: string | null): string => {
    if (!birthday) {
        return '—';
    }
    const parsed = new Date(birthday);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed);
};

const deriveGenderTypeFromOccupants = (rooms: RoomWithOccupants[]): RoomWithOccupants['genderType'] => {
    const genders = rooms
        .flatMap(room => room.occupants)
        .map(student => student.gender)
        .filter((gender): gender is boolean => gender !== null);

    if (genders.length === 0) {
        return null;
    }

    const hasMaleStudents = genders.some(gender => gender === true);
    const hasFemaleStudents = genders.some(gender => gender === false);

    if (hasMaleStudents && hasFemaleStudents) {
        return null;
    }

    return hasMaleStudents ? true : false;
};

const StructureLayout: React.FC = () => {
    const navigate = useNavigate();
    const { rooms, students, loading, error, refetch } = useDormStructureData();
    const userSessionStr = typeof window !== 'undefined' ? sessionStorage.getItem('userSession') : null;
    const userSession: UserSession | null = userSessionStr ? JSON.parse(userSessionStr) : null;
    const roleName = userSession?.role?.name?.toLowerCase() ?? '';
    const isEducator = roleName.includes('воспитатель');
    const canManageRooms = !isEducator;

    const [selectedStudentId, setSelectedStudentId] = useState<'all' | number>('all');
    const [selectedFloor, setSelectedFloor] = useState<'all' | number>('all');
    const [selectedRoomId, setSelectedRoomId] = useState<'all' | number>('all');
    const [activeBlockKey, setActiveBlockKey] = useState<string | null>(null);
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
    const [settlementForm, setSettlementForm] = useState<SettlementFormState>(settlementFormInitialState);
    const [settlementErrors, setSettlementErrors] = useState<SettlementFormErrors>({});
    const [settlementAlert, setSettlementAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isSettling, setIsSettling] = useState(false);
    const [activeTabId, setActiveTabId] = useState<string>(() => {
        const fallbackTabId = STRUCTURE_TAB_IDS[0];
        if (typeof window === 'undefined') {
            return fallbackTabId;
        }
        const storedTabId = sessionStorage.getItem(STRUCTURE_TABS_STORAGE_KEY);
        return storedTabId && STRUCTURE_TAB_IDS.some(id => id === storedTabId)
            ? storedTabId
            : fallbackTabId;
    });

    useEffect(() => {
        if (!settlementAlert) {
            return;
        }
        const timeout = window.setTimeout(() => {
            setSettlementAlert(null);
        }, 4000);
        return () => window.clearTimeout(timeout);
    }, [settlementAlert]);

    const loadStructureStats = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
            const data = await apiClient.getStructureStatistics();
            setStructureStats(data);
        } catch (err: any) {
            const message = err?.message || 'Не удалось загрузить статистику общежития';
            setStatsError(message);
            console.error('Ошибка при загрузке статистики общежития:', err);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadStructureStats();
    }, [loadStructureStats]);


    const roomsWithOccupants = useMemo<RoomWithOccupants[]>(() => {
        return rooms
            .map(room => ({
                ...room,
                occupants: students.filter(student => student.roomId === room.id),
            }))
            .sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber));
    }, [rooms, students]);

    const floorOptions = useMemo(() => {
        const floorsSet = new Set<number>();
        roomsWithOccupants.forEach(room => floorsSet.add(room.floorNumber));
        const options = Array.from(floorsSet)
            .sort((a, b) => a - b)
            .map(floor => ({ value: floor, label: `${floor} этаж` }));
        return [{ value: 'all', label: 'Все этажи' }, ...options];
    }, [roomsWithOccupants]);

    const roomOptions = useMemo(() => {
        const options = roomsWithOccupants
            .map(room => ({
                value: room.id.toString(),
                label: `${room.roomNumber}(${room.capacity})`,
                sortKey: Number(room.roomNumber),
            }))
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(({ value, label }) => ({ value, label }));
        return [{ value: 'all', label: 'Все комнаты' }, ...options];
    }, [roomsWithOccupants]);

    const studentOptions = useMemo(() => {
        const uniqueStudents = students
            .filter(student => student.roomId !== null && student.roomId !== undefined)
            .map(student => ({
                value: student.id.toString(),
                label: formatShortName(student),
            }))
            .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
        return [{ value: 'all', label: 'Все студенты' }, ...uniqueStudents];
    }, [students]);

    const roomsById = useMemo(() => {
        const map = new Map<number, RoomDto>();
        rooms.forEach(room => map.set(room.id, room));
        return map;
    }, [rooms]);

    const unassignedStudents = useMemo(() => {
        return students.filter(student => student.roomId === null || student.roomId === undefined);
    }, [students]);

    const availableRooms = useMemo(() => {
        return rooms.filter(room => room.currentCapacity < room.capacity);
    }, [rooms]);

    const settlementStudentOptions = useMemo(() => {
        return [
            { value: '', label: 'Выберите студента' },
            ...unassignedStudents
                .map(student => ({ value: student.id.toString(), label: formatShortName(student) }))
                .sort((a, b) => a.label.localeCompare(b.label, 'ru')),
        ];
    }, [unassignedStudents]);

    const settlementFloorOptions = useMemo(() => {
        const floorsSet = new Set<number>();
        availableRooms.forEach(room => floorsSet.add(room.floorNumber));
        const floorOptions = Array.from(floorsSet)
            .sort((a, b) => a - b)
            .map(floor => ({ value: floor.toString(), label: `${floor} этаж` }));
        return [{ value: '', label: 'Выберите этаж' }, ...floorOptions];
    }, [availableRooms]);

    const settlementRoomOptions = useMemo(() => {
        const targetRooms = settlementForm.floorNumber
            ? availableRooms.filter(room => room.floorNumber === Number(settlementForm.floorNumber))
            : availableRooms;

        const sortedRooms = targetRooms
            .slice()
            .sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber))
            .map(room => ({
                value: room.id.toString(),
                label: `Комната ${room.roomNumber} • ${room.currentCapacity}/${room.capacity}`,
            }));

        return [
            {
                value: '',
                label: sortedRooms.length ? 'Выберите комнату' : 'Нет доступных комнат',
            },
            ...sortedRooms,
        ];
    }, [availableRooms, settlementForm.floorNumber]);

    const unassignedStudentsSorted = useMemo(() => {
        return unassignedStudents
            .slice()
            .sort((a, b) => formatFullName(a).localeCompare(formatFullName(b), 'ru'));
    }, [unassignedStudents]);

    const unassignedColumns = useMemo(() => ([
        {
            key: 'fullName',
            title: 'ФИО',
            render: (student: StudentsDto) => formatFullName(student) || '—',
        },
        {
            key: 'group.name',
            title: 'Группа',
            render: (student: StudentsDto) => student.group?.name ?? '—',
        },
        {
            key: 'group.course',
            title: 'Курс',
            render: (student: StudentsDto) => student.group?.course ?? '—',
            className: styles.tableNumericCell,
        },
        {
            key: 'gender',
            title: 'Пол',
            render: (student: StudentsDto) => getStudentGenderLabel(student.gender),
        },
        {
            key: 'phone',
            title: 'Телефон',
            render: (student: StudentsDto) => student.phone ?? '—',
        },
        {
            key: 'birthday',
            title: 'Дата рождения',
            render: (student: StudentsDto) => formatBirthday(student.birthday),
        },
    ]), [navigate]);

    const getBlockKey = (floorNumber: number, blockNumber: string) => `${floorNumber}-${blockNumber}`;

    const filteredRooms = useMemo(() => {
        const selectedRoom = selectedRoomId === 'all'
            ? null
            : roomsWithOccupants.find(room => room.id === selectedRoomId) ?? null;
        const targetBlockKey = selectedRoom ? getBlockKey(selectedRoom.floorNumber, selectedRoom.roomNumber) : null;

        return roomsWithOccupants.filter(room => {
            if (selectedFloor !== 'all' && room.floorNumber !== selectedFloor) {
                return false;
            }
            if (selectedStudentId !== 'all' && !room.occupants.some(student => student.id === selectedStudentId)) {
                return false;
            }

            if (targetBlockKey) {
                return getBlockKey(room.floorNumber, room.roomNumber) === targetBlockKey;
            }

            if (selectedRoomId !== 'all') {
                return room.id === selectedRoomId;
            }

            return true;
        });
    }, [roomsWithOccupants, selectedFloor, selectedRoomId, selectedStudentId]);

    const floors = useMemo<FloorWithBlocks[]>(() => {
        const floorMap = new Map<number, Map<string, BlockWithRooms>>();

        filteredRooms.forEach(room => {
            if (!floorMap.has(room.floorNumber)) {
                floorMap.set(room.floorNumber, new Map());
            }

            const blocksMap = floorMap.get(room.floorNumber)!;
            const blockNumber = room.roomNumber;

            if (!blocksMap.has(blockNumber)) {
                blocksMap.set(blockNumber, {
                    blockNumber,
                    floorNumber: room.floorNumber,
                    rooms: [],
                    capacity: 0,
                    currentCapacity: 0,
                    genderType: room.genderType,
                });
            }

            const block = blocksMap.get(blockNumber)!;
            block.rooms.push(room);
            block.capacity += room.capacity;
            block.currentCapacity += room.currentCapacity;
            block.genderType = deriveGenderTypeFromOccupants(block.rooms);
        });

        return Array.from(floorMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([floor, blocksMap]) => {
                const blocks = Array.from(blocksMap.values())
                    .sort((a, b) => a.blockNumber.localeCompare(b.blockNumber, 'ru'));
                const total = blocks.reduce((acc, block) => acc + block.capacity, 0);
                const free = blocks.reduce((acc, block) => acc + Math.max(block.capacity - block.currentCapacity, 0), 0);
                return { floor, blocks, total, free };
            });
    }, [filteredRooms]);

    const activeBlock = useMemo(() => {
        if (!activeBlockKey) {
            return null;
        }

        for (const floor of floors) {
            const found = floor.blocks.find(block => getBlockKey(block.floorNumber, block.blockNumber) === activeBlockKey);
            if (found) {
                return found;
            }
        }

        return null;
    }, [activeBlockKey, floors]);

    const openBlockModal = (block: BlockWithRooms) => {
        setActiveBlockKey(getBlockKey(block.floorNumber, block.blockNumber));
    };

    const closeBlockModal = () => {
        setActiveBlockKey(null);
    };

    const resetFilters = () => {
        setSelectedStudentId('all');
        setSelectedFloor('all');
        setSelectedRoomId('all');
    };

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

    const handleSettlementStudentChange = (value: string) => {
        setSettlementForm(prev => ({ ...prev, studentId: value }));
        if (settlementErrors.studentId) {
            setSettlementErrors(prev => ({ ...prev, studentId: undefined }));
        }
        setSettlementAlert(null);
    };

    const handleSettlementFloorChange = (value: string) => {
        setSettlementForm(prev => {
            const nextState = { ...prev, floorNumber: value };
            if (value && prev.roomId) {
                const currentRoom = roomsById.get(Number(prev.roomId));
                if (currentRoom && currentRoom.floorNumber.toString() !== value) {
                    nextState.roomId = '';
                }
            }
            return nextState;
        });
        setSettlementAlert(null);
    };

    const handleSettlementRoomChange = (value: string) => {
        setSettlementForm(prev => {
            if (!value) {
                return { ...prev, roomId: '', floorNumber: prev.floorNumber };
            }
            const room = roomsById.get(Number(value));
            return {
                ...prev,
                roomId: value,
                floorNumber: room ? room.floorNumber.toString() : prev.floorNumber,
            };
        });
        if (settlementErrors.roomId) {
            setSettlementErrors(prev => ({ ...prev, roomId: undefined }));
        }
        setSettlementAlert(null);
    };

    const handleSettlementReset = () => {
        setSettlementForm(settlementFormInitialState);
        setSettlementErrors({});
        setSettlementAlert(null);
    };

    const handleSettlementSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const errors: SettlementFormErrors = {};
        if (!settlementForm.studentId) {
            errors.studentId = 'Выберите студента';
        }
        if (!settlementForm.roomId) {
            errors.roomId = 'Выберите комнату';
        }
        setSettlementErrors(errors);
        if (Object.keys(errors).length > 0) {
            setSettlementAlert({ type: 'error', message: 'Заполните обязательные поля' });
            return;
        }

        setSettlementAlert(null);
        setIsSettling(true);
        try {
            await apiClient.assignStudentToRoom(Number(settlementForm.studentId), Number(settlementForm.roomId));
            setSettlementForm(settlementFormInitialState);
            setSettlementErrors({});
            setSettlementAlert({ type: 'success', message: 'Студент успешно заселён' });
            refetch();
            await loadStructureStats();
        } catch (err: any) {
            setSettlementAlert({ type: 'error', message: err?.message || 'Не удалось заселить студента' });
        } finally {
            setIsSettling(false);
        }
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
            }
        });

        setNewRoomErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddRoomSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateNewRoomForm()) {
            return;
        }

        const payload = {
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
            await loadStructureStats();
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
            await loadStructureStats();
        } catch (err: any) {
            console.error('Ошибка при удалении комнаты:', err);
            alert(err?.message || 'Не удалось удалить комнату');
        } finally {
            setDeletingRoomId(null);
        }
    };

    const handleTabChange = (tabId: string) => {
        setActiveTabId(tabId);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(STRUCTURE_TABS_STORAGE_KEY, tabId);
        }
    };

    const handleFreeSlotClick = (room: RoomWithOccupants) => {
        handleTabChange('settlement');
        setSettlementForm(prev => ({
            ...prev,
            floorNumber: room.floorNumber.toString(),
            roomId: room.id.toString(),
        }));
        setSettlementErrors(prev => ({ ...prev, roomId: undefined }));
        setSettlementAlert(null);
        closeBlockModal();
    };

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
        <div className={styles.searchSection}>
            <div className={styles.filtersGrid}>
                <SelectField
                    label="Студент"
                    value={selectedStudentId === 'all' ? 'all' : selectedStudentId.toString()}
                    onChange={(e) => setSelectedStudentId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    options={studentOptions}
                />
                <SelectField
                    label="Этаж"
                    value={selectedFloor === 'all' ? 'all' : selectedFloor.toString()}
                    onChange={(e) => setSelectedFloor(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    options={floorOptions.map(option => ({ value: option.value.toString(), label: option.label }))}
                />
                <SelectField
                    label="Комната"
                    value={selectedRoomId === 'all' ? 'all' : selectedRoomId.toString()}
                    onChange={(e) => setSelectedRoomId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    options={roomOptions}
                />
                <ActionButton
                    variant='secondary'
                    size='md'
                    onClick={resetFilters}
                    className={styles.resetButton}
                >
                    Сбросить
                </ActionButton>
            </div>
        </div>
    );

    const structureTabContent = (
        <>
            {statsLoading && (
                <div className="d-flex justify-content-center align-items-center my-3">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Загрузка статистики...</span>
                    </div>
                </div>
            )}

            {!statsLoading && statsError && (
                <div className="alert alert-warning" role="alert">
                    {statsError}
                </div>
            )}

            <div className={styles.structureWrapper}>
                {floors.length === 0 && (
                    <div className={styles.emptyState}>
                        <i className="bi bi-buildings" />
                        <p>Блоки не найдены</p>
                    </div>
                )}

                {floors.length === 0 && canManageRooms && (
                    <div className={styles.tableContainer}>
                        <ActionButton
                            size='md'
                            variant='primary'
                            onClick={() => openAddRoomModal()}
                            className={styles.fullWidthMobileButton}
                        >
                            <span className="me-2">+</span>
                            Добавить комнату
                        </ActionButton>
                    </div>
                )}

                {floors.map(floor => (
                    <section key={floor.floor} className={styles.floorSection}>
                        <div className={styles.floorHeader}>
                            <h3 className={styles.floorTitle}>{floor.floor} этаж</h3>
                            {canManageRooms && (
                                <div className={styles.floorActions}>
                                    <ActionButton
                                        variant='secondary'
                                        size='md'
                                        className={styles.addRoomButton}
                                        onClick={() => openAddRoomModal(floor.floor)}
                                    >
                                        <span className={styles.addRoomButtonIcon}>+</span>
                                        <span className={styles.addRoomButtonText}>Добавить</span>
                                    </ActionButton>
                                </div>
                            )}
                        </div>
                        <div className={styles.blocksGrid}>
                            {floor.blocks.map(block => {
                                const blockOccupants = block.rooms.flatMap(room => room.occupants);
                                const occupantsPreview = blockOccupants.map(formatShortName).filter(Boolean);
                                const remaining = Math.max(occupantsPreview.length - 3, 0);
                                const blockStatus = getStatus(block.currentCapacity, block.capacity);
                                return (
                                    <article
                                        key={`${block.floorNumber}-${block.blockNumber}`}
                                        className={`${styles.blockCard} ${blockStatus === 'occupied' ? styles.blockCardOccupied : ''}`}
                                        onClick={() => openBlockModal(block)}
                                    >
                                        <div className={styles.blockHeader}>
                                            <p className={styles.blockNumber}>
                                                <span className={styles.blockNumberBadge}>{block.blockNumber}</span>
                                            </p>
                                            <div className={styles.blockMetaColumn}>
                                                <p className={styles.blockMeta}>
                                                    <span className={styles.blockMetaLabel}>Тип</span>
                                                    <span className={styles.blockMetaValue}>{getGenderLabel(block)}</span>
                                                </p>
                                                <p className={styles.blockMeta}>
                                                    <span className={styles.blockMetaLabel}>Заселено</span>
                                                    <span className={styles.blockMetaValue}>{block.currentCapacity}/{block.capacity}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <p className={styles.blockOccupants}>
                                            {occupantsPreview.slice(0, 3).join(', ') || ''}
                                            {remaining > 0 && <span className={styles.moreOccupants}> + ещё {remaining}</span>}
                                        </p>
                                        <div className={styles.blockActions}>
                                            <ActionButton
                                                variant='secondary'
                                                size='md'
                                                className={styles.blockActionBtn}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    openBlockModal(block);
                                                }}
                                            >
                                                Подробнее
                                            </ActionButton>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </>
    );

    const settlementHeaderContent = (
        <section className={styles.settlementCard}>
            <form className={styles.settlementForm} onSubmit={handleSettlementSubmit}>
                <div className={styles.settlementFormGrid}>
                    <SelectField
                        label="Студент"
                        value={settlementForm.studentId}
                        onChange={(e) => handleSettlementStudentChange(e.target.value)}
                        options={settlementStudentOptions}
                        disabled={isSettling || unassignedStudents.length === 0}
                        error={settlementErrors.studentId}
                    />
                    <SelectField
                        label="Этаж"
                        value={settlementForm.floorNumber}
                        onChange={(e) => handleSettlementFloorChange(e.target.value)}
                        options={settlementFloorOptions}
                        disabled={isSettling || availableRooms.length === 0}
                    />
                    <SelectField
                        label="Комната"
                        value={settlementForm.roomId}
                        onChange={(e) => handleSettlementRoomChange(e.target.value)}
                        options={settlementRoomOptions}
                        disabled={isSettling || availableRooms.length === 0}
                        error={settlementErrors.roomId}
                    />
                </div>
                <div className={styles.settlementActions}>
                    <ActionButton
                        variant='secondary'
                        size='md'
                        type='button'
                        className={styles.fullWidthMobileButton}
                        onClick={handleSettlementReset}
                        disabled={isSettling}
                    >
                        Сбросить
                    </ActionButton>
                    <ActionButton
                        variant='primary'
                        size='md'
                        type='submit'
                        className={styles.fullWidthMobileButton}
                        disabled={isSettling || !unassignedStudents.length || !availableRooms.length}
                    >
                        {isSettling ? 'Заселяем…' : 'Заселить студента'}
                    </ActionButton>
                </div>
            </form>
        </section>
    );


    const rowAction = {
        icon: 'bi-arrows-angle-expand',
        title: 'Открыть карточку студента',
        onClick: (student: StudentsDto) => navigate(`/dashboard/students/${student.id}`),
    };
    const settlementTabContent = (
        <div className={styles.unassignedTableWrapper}>
            <div className={styles.desktopTable}>
                <CommonTable
                    data={unassignedStudentsSorted}
                    columns={unassignedColumns}
                    emptyMessage="Все студенты уже заселены"
                    rowAction={rowAction}
                    className={styles.tablePlain}
                />
            </div>
            <div className={styles.mobileCardsWrapper}>
                {unassignedStudentsSorted.length ? (
                    unassignedStudentsSorted.map(student => (
                        <button
                            type="button"
                            key={student.id}
                            className={styles.mobileCard}
                            onClick={() => navigate(`/dashboard/students/${student.id}`)}
                        >
                            <p className={styles.mobileCardTitle}>{formatFullName(student) || '—'}</p>
                            <div className={styles.mobileCardDivider}></div>
                            <div className={styles.mobileCardRow}>
                                <div className={styles.blockMetaColumn}>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Группа</span>
                                        <span className={styles.blockMetaValue}>{student.group?.name ?? '—'}</span>
                                    </div>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Телефон</span>
                                        <span className={styles.blockMetaValue}>{student.phone ?? '—'}</span>
                                    </div>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Рожден</span>
                                        <span className={styles.blockMetaValue}>{formatBirthday(student.birthday)}</span>
                                    </div>
                                </div>
                                <div className={styles.blockMetaColumn}>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Курс</span>
                                        <span className={styles.blockMetaValue}>{student.group?.course ?? '—'}</span>
                                    </div>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Пол</span>
                                        <span className={styles.blockMetaValue}>{getStudentGenderLabel(student.gender)}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className={styles.mobileCardsEmpty}>Все студенты уже заселены</div>
                )}
            </div>
        </div>
    );

    const tabs = [
        { id: 'structure', title: 'Структура', headerContent: structureHeaderContent, content: structureTabContent },
        { id: 'settlement', title: 'Расселение', headerContent: settlementHeaderContent, content: settlementTabContent },
    ];

    const settlementToast = settlementAlert && typeof document !== 'undefined'
        ? createPortal(
            <div className={styles.toastContainer}>
                <div className={`${styles.toast} ${settlementAlert.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                    <span>{settlementAlert.message}</span>
                    <button
                        type="button"
                        className={styles.toastCloseButton}
                        onClick={() => setSettlementAlert(null)}
                        aria-label="Закрыть уведомление"
                    >
                        ×
                    </button>
                </div>
            </div>,
            document.body
        )
        : null;

    return (
        <>

            {settlementToast}


            {canManageRooms && (
                <CommonModal
                    title="Добавить комнату"
                    isOpen={isAddRoomModalOpen}
                    onClose={closeAddRoomModal}
                    minWidth={520}
                >
                    <form className={styles.addRoomForm} onSubmit={handleAddRoomSubmit}>
                        <div className={styles.addRoomFormGrid}>
                            <InputField
                                label="Номер этажа"
                                type="number"
                                min="1"
                                inputMode="numeric"
                                value={newRoomForm.floorNumber}
                                onChange={(e) => handleNewRoomFieldChange('floorNumber', e.target.value)}
                                disabled={isCreatingRoom}
                                error={newRoomErrors.floorNumber}
                            />
                            <InputField
                                label="Номер комнаты"
                                type="number"
                                min="1"
                                inputMode="numeric"
                                value={newRoomForm.roomNumber}
                                onChange={(e) => handleNewRoomFieldChange('roomNumber', e.target.value)}
                                disabled={isCreatingRoom}
                                error={newRoomErrors.roomNumber}
                            />
                            <InputField
                                label="Вместимость"
                                type="number"
                                min="1"
                                inputMode="numeric"
                                value={newRoomForm.capacity}
                                onChange={(e) => handleNewRoomFieldChange('capacity', e.target.value)}
                                disabled={isCreatingRoom}
                                error={newRoomErrors.capacity}
                            />
                        </div>
                        <div className={styles.addRoomActions}>
                            <ActionButton
                                size='md'
                                variant='secondary'
                                type='button'
                                className={styles.fullWidthMobileButton}
                                onClick={closeAddRoomModal}
                                disabled={isCreatingRoom}
                            >
                                Отмена
                            </ActionButton>
                            <ActionButton
                                size='md'
                                variant='primary'
                                type='submit'
                                className={styles.fullWidthMobileButton}
                                disabled={isCreatingRoom}
                            >
                                {isCreatingRoom ? 'Добавляем…' : 'Добавить'}
                            </ActionButton>
                        </div>
                    </form>
                </CommonModal>
            )}

            {!statsLoading && !statsError && structureStats && (
                <StatisticsCard
                    stats={[
                        { value: students.length, label: 'Всего студентов' },
                        { value: structureStats.studentCount, label: 'Заселено студентов' },
                        { value: Math.max(students.length - structureStats.studentCount, 0), label: 'Свободно студентов' },
                        { value: structureStats.totalCopacity, label: 'Всего мест' },
                        { value: structureStats.freeCount, label: 'Свободных мест' },
                    ]}
                />
            )}

            <Tabs
                tabs={tabs}
                activeTabId={activeTabId}
                onTabChange={handleTabChange}
            />
            <CommonModal
                title={activeBlock && (
                    <div className={styles.blockHeader}>
                        <p className={styles.blockNumber}>
                            <span className={styles.blockNumberBadge}>{activeBlock.blockNumber}</span>
                        </p>
                        <div className={styles.blockMetaColumn}>
                            <p className={styles.blockMeta}>
                                <span className={styles.blockMetaLabel}>Тип</span>
                                <span className={styles.blockMetaValue}>{getGenderLabel(activeBlock)}</span>
                            </p>
                            <p className={styles.blockMeta}>
                                <span className={styles.blockMetaLabel}>Этаж</span>
                                <span className={styles.blockMetaValue}>{activeBlock.floorNumber}</span>
                            </p>
                        </div>
                        <div className={styles.blockMetaColumn}>
                            <p className={styles.blockMeta}>
                                <span className={styles.blockMetaLabel}>Статус</span>
                                <span className={styles.blockMetaValue}>{getStatus(activeBlock.currentCapacity, activeBlock.capacity) === 'occupied' ? 'Занят' : getStatus(activeBlock.currentCapacity, activeBlock.capacity) === 'free' ? 'Свободен' : 'Частично занят'}</span>
                            </p>
                            <p className={styles.blockMeta}>
                                <span className={styles.blockMetaLabel}>Заселено</span>
                                <span className={styles.blockMetaValue}>{activeBlock.currentCapacity}/{activeBlock.capacity}</span>
                            </p>

                        </div>
                    </div>
                )}
                isOpen={Boolean(activeBlock)}
                onClose={closeBlockModal}
                minWidth={720}
            >
                {activeBlock && (
                    <div className={styles.modalContentWrapper}>
                        {activeBlock.rooms.map((room, roomIndex) => {
                            const freeSlotsCount = Math.max(room.capacity - room.currentCapacity, 0);
                            return (
                                <div key={room.id} className={styles.blockRoomSection}>
                                    <div className={styles.blockRoomHeader}>
                                        <p className={styles.blockRoomTitle}>Комната {roomIndex + 1}</p>
                                        {canManageRooms && (
                                            <ActionButton
                                                variant='transparent-primary'
                                                size='sm'
                                                type='button'
                                                className={styles.blockRoomDeleteButton}
                                                disabled={deletingRoomId === room.id}
                                                onClick={() => handleDeleteRoom(room.id, room.roomNumber)}
                                            >
                                                {deletingRoomId === room.id ? 'Удаляем…' : 'Удалить'}
                                            </ActionButton>
                                        )}
                                    </div>
                                    <div className={styles.studentsList}>
                                        {room.occupants.map(student => (
                                            <div key={student.id} className={styles.studentRow}>
                                                <div className={styles.studentInfo}>
                                                    <div className={styles.studentAvatar}>{getInitials(student)}</div>
                                                    <div>
                                                        <p className={styles.studentName}>{formatShortName(student)}</p>
                                                        <p className={styles.studentMeta}>
                                                            {student.group?.name ?? '—'} · {student.group?.course ?? '—'} курс
                                                        </p>
                                                    </div>
                                                </div>
                                                <ActionButton
                                                    variant='secondary'
                                                    size='sm'
                                                    className={styles.studentCardButton}
                                                    onClick={() => navigate(`/dashboard/students/${student.id}`)}
                                                >
                                                    Карточка
                                                </ActionButton>
                                            </div>
                                        ))}
                                        {freeSlotsCount > 0 && Array.from({ length: freeSlotsCount }).map((_, slotIndex) => (
                                            <div
                                                key={`${room.id}-free-${slotIndex}`}
                                                className={`${styles.studentRow} ${styles.freeSlotCard}`}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleFreeSlotClick(room)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        handleFreeSlotClick(room);
                                                    }
                                                }}
                                            >
                                                <div className={styles.studentInfo}>
                                                    <div className={`${styles.studentAvatar} ${styles.freeSlotAvatar}`}>+</div>
                                                    <div>
                                                        <p className={styles.studentName}>Свободное место</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CommonModal>
        </>
    );
};

export default StructureLayout;
