import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectField from '../../../components/SelectField/SelectField';
import ActionButton from '../../../components/ActionButton/ActionButton';
import CommonModal from '../../../components/CommonModal/CommonModal';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import { useDormStructureData } from '../../../hooks/useDormStructureData';
import { apiClient } from '../../../api/client';
import type { RoomDto } from '../../../types/rooms';
import type { StudentsDto } from '../../../types/students';
import type { StructureStatisticDto } from '../../../types/structures';
import styles from './Structure.module.css';

type RoomWithOccupants = RoomDto & { occupants: StudentsDto[] };
type RoomStatus = 'occupied' | 'free' | 'partial';

const getStatus = (room: RoomWithOccupants): RoomStatus => {
    if (room.currentCapacity === 0) {
        return 'free';
    }
    if (room.currentCapacity >= room.capacity) {
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

const getGenderLabel = (room: RoomWithOccupants): string => {
    if (room.genderType === null) {
        return '-';
    }
    return room.genderType ? 'Мужской' : 'Женский';
};

const StructureLayout: React.FC = () => {
    const navigate = useNavigate();
    const { rooms, students, loading, error } = useDormStructureData();

    const [selectedStudentId, setSelectedStudentId] = useState<'all' | number>('all');
    const [selectedFloor, setSelectedFloor] = useState<'all' | number>('all');
    const [selectedRoomId, setSelectedRoomId] = useState<'all' | number>('all');
    const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
    const [structureStats, setStructureStats] = useState<StructureStatisticDto | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [isMobileViewport, setIsMobileViewport] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.innerWidth <= 768;
    });

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

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleViewportChange = (event: MediaQueryListEvent | MediaQueryList) => {
            setIsMobileViewport(event.matches);
        };

        handleViewportChange(mediaQuery);
        mediaQuery.addEventListener('change', handleViewportChange);

        return () => {
            mediaQuery.removeEventListener('change', handleViewportChange);
        };
    }, []);

    const roomsWithOccupants = useMemo<RoomWithOccupants[]>(() => {
        return rooms
            .map(room => ({
                ...room,
                occupants: students.filter(student => student.roomId === room.id),
            }))
            .sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber));
    }, [rooms, students]);

    const activeRoom = useMemo(() => {
        return activeRoomId ? roomsWithOccupants.find(room => room.id === activeRoomId) ?? null : null;
    }, [activeRoomId, roomsWithOccupants]);

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

    const filteredRooms = useMemo(() => {
        return roomsWithOccupants.filter(room => {
            if (selectedFloor !== 'all' && room.floorNumber !== selectedFloor) {
                return false;
            }
            if (selectedRoomId !== 'all' && room.id !== selectedRoomId) {
                return false;
            }
            if (selectedStudentId !== 'all' && !room.occupants.some(student => student.id === selectedStudentId)) {
                return false;
            }
            return true;
        });
    }, [roomsWithOccupants, selectedFloor, selectedRoomId, selectedStudentId]);

    const floors = useMemo(() => {
        const floorMap = new Map<number, RoomWithOccupants[]>();
        filteredRooms.forEach(room => {
            if (!floorMap.has(room.floorNumber)) {
                floorMap.set(room.floorNumber, []);
            }
            floorMap.get(room.floorNumber)!.push(room);
        });

        return Array.from(floorMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([floor, roomsOnFloor]) => {
                const sortedRooms = roomsOnFloor.sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber));
                const total = sortedRooms.reduce((acc, room) => acc + room.capacity, 0);
                const free = sortedRooms.reduce((acc, room) => acc + Math.max(room.capacity - room.currentCapacity, 0), 0);
                return { floor, rooms: sortedRooms, total, free };
            });
    }, [filteredRooms]);

    const openRoomModal = (roomId: number) => {
        setActiveRoomId(roomId);
    };

    const closeRoomModal = () => {
        setActiveRoomId(null);
    };

    const resetFilters = () => {
        setSelectedStudentId('all');
        setSelectedFloor('all');
        setSelectedRoomId('all');
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
                        size={isMobileViewport ? 'md' : 'md'}
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
                            <div>
                                <h3 className={styles.floorTitle}>{floor.floor} этаж</h3>
                            </div>
                        </div>
                        <div className={styles.blocksGrid}>
                            {floor.rooms.map(room => {
                                const occupantsPreview = room.occupants.map(formatShortName).filter(Boolean);
                                const remaining = Math.max(occupantsPreview.length - 3, 0);
                                return (
                                    <article
                                        key={room.id}
                                        className={`${styles.blockCard} ${getStatus(room) === 'occupied' ? styles.blockCardOccupied : ''}`}
                                        onClick={() => openRoomModal(room.id)}
                                    >
                                        <div className={styles.blockHeader}>
                                            <p className={styles.blockNumber}>
                                                <span className={styles.blockNumberBadge}>{room.roomNumber}</span>
                                            </p>
                                            <div className={styles.blockMetaColumn}>
                                                <p className={styles.blockMeta}>
                                                    <span className={styles.blockMetaLabel}>Тип</span>
                                                    <span className={styles.blockMetaValue}>{getGenderLabel(room)}</span>
                                                </p>
                                                <p className={styles.blockMeta}>
                                                    <span className={styles.blockMetaLabel}>Заселено</span>
                                                    <span className={styles.blockMetaValue}>{room.currentCapacity}/{room.capacity}</span>
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
                                                    openRoomModal(room.id);
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

            <CommonModal
                title={activeRoom ? `Блок ${activeRoom.roomNumber}` : ''}
                isOpen={Boolean(activeRoom)}
                onClose={closeRoomModal}
                minWidth={720}
            >
                {activeRoom && (
                    <div className={styles.modalContentWrapper}>
                        <div className={styles.modalInfoGrid}>
                            <div>
                                <p className={styles.infoLabel}>Этаж</p>
                                <p className={styles.infoValue}>{activeRoom.floorNumber}</p>
                            </div>
                            <div>
                                <p className={styles.infoLabel}>Тип блока</p>
                                <p className={styles.infoValue}>{getGenderLabel(activeRoom)}</p>
                            </div>
                            <div>
                                <p className={styles.infoLabel}>Количество мест</p>
                                <p className={styles.infoValue}>{activeRoom.capacity}</p>
                            </div>
                            <div>
                                <p className={styles.infoLabel}>Заселено</p>
                                <p className={styles.infoValue}>
                                    {activeRoom.currentCapacity}/{activeRoom.capacity}
                                </p>
                            </div>
                        </div>

                        <div className={styles.studentsList}>
                            <h4>Жильцы блока</h4>
                            {activeRoom.occupants.length === 0 && (
                                <div className={styles.freeSlot}>В блоке нет проживающих. Доступно {activeRoom.capacity} мест.</div>
                            )}
                            {activeRoom.occupants.map(student => (
                                <div key={student.id} className={styles.studentRow}>
                                    <div className={styles.studentInfo}>
                                        <div className={styles.studentAvatar}>{getInitials(student)}</div>
                                        <div>
                                            <p className={styles.studentName}>{formatShortName(student)}</p>
                                            <p className={styles.studentMeta}>
                                                Группа: {student.group?.name ?? '—'} · {student.group?.course ?? '—'} курс
                                            </p>
                                            {student.phone && (
                                                <p className={styles.studentMeta}>Телефон: {student.phone}</p>
                                            )}
                                        </div>
                                    </div>
                                    <ActionButton
                                        variant='transparent-primary'
                                        size='sm'
                                        onClick={() => navigate(`/dashboard/students/${student.id}`)}
                                    >
                                        Карточка
                                    </ActionButton>
                                </div>
                            ))}
                            {Math.max(activeRoom.capacity - activeRoom.currentCapacity, 0) > 0 && (
                                <div className={styles.freeSlot}>
                                    Свободных мест: {Math.max(activeRoom.capacity - activeRoom.currentCapacity, 0)}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CommonModal>
        </>
    );
};

export default StructureLayout;
