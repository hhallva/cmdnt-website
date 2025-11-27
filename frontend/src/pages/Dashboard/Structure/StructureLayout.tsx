import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectField from '../../../components/SelectField/SelectField';
import ActionButton from '../../../components/ActionButton/ActionButton';
import CommonModal from '../../../components/CommonModal/CommonModal';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import InputField from '../../../components/InputField/InputField';
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

const getGenderLabel = (entity: { genderType: RoomWithOccupants['genderType'] }): string => {
    if (entity.genderType === null) {
        return '-';
    }
    return entity.genderType ? 'Мужской' : 'Женский';
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
                label: `Комната ${room.roomNumber} (${room.capacity})`,
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

    return (
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

            {!statsLoading && !statsError && structureStats && (
                <StatisticsCard
                    stats={[
                        { value: students.length, label: 'Всего студентов' },
                        { value: structureStats.studentCount, label: 'Заселено студентов' },
                        { value: Math.max(students.length - structureStats.studentCount, 0), label: 'Свободно студентов' },//TODO: Добавить строку в API чтоб она не вычислялась тут,
                        { value: structureStats.totalCopacity, label: 'Всего мест' },
                        { value: structureStats.freeCount, label: 'Свободных мест' },
                    ]}
                />
            )}

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

            <div className={styles.structureWrapper}>
                {floors.length === 0 && (
                    <div className={styles.emptyState}>
                        <i className="bi bi-buildings" />
                        <p>Блоки не найдены</p>
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
                                variant='secondary'
                                type='button'
                                onClick={closeAddRoomModal}
                                disabled={isCreatingRoom}
                            >
                                Отмена
                            </ActionButton>
                            <ActionButton
                                variant='primary'
                                type='submit'
                                disabled={isCreatingRoom}
                            >
                                {isCreatingRoom ? 'Добавляем…' : 'Добавить комнату'}
                            </ActionButton>
                        </div>
                    </form>
                </CommonModal>
            )}

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
                                            <div key={`${room.id}-free-${slotIndex}`} className={`${styles.studentRow} ${styles.freeSlotCard}`}>
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
