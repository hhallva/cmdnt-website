import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ActionButton from '../../../components/ActionButton/ActionButton';
import CommonModal from '../../../components/CommonModal/CommonModal';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import InputField from '../../../components/InputField/InputField';
import Tabs from '../../../components/Tabs/Tabs';
import { useDormStructureData } from '../../../hooks/useDormStructureData';
import { apiClient } from '../../../api/client';
import type { StudentsDto } from '../../../types/students';
import type { StructureStatisticDto } from '../../../types/structures';
import type { UserSession } from '../../../types/UserSession';
import type { RoomWithOccupants } from './types';
import { StructureTabContent, StructureTabHeader } from './components/StructureTab';
import { SettlementTabContent, SettlementTabHeader } from './components/SettlementTab';
import styles from './Structure.module.css';
import {
    formatBirthday,
    formatFullName,
    formatShortName,
    getGenderLabel,
    getInitials,
    getStatus,
    getStudentGenderLabel,
} from './utils';
import { SETTLEMENT_TAB_ID, STRUCTURE_TAB_IDS } from './constants';
import { useStructureTabs } from './hooks/useStructureTabs';
import { useStructureFilters } from './hooks/useStructureFilters';
import { useSettlementForm } from './hooks/useSettlementForm';

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

    const loadStructureStats = useCallback(async () => {
        if (!buildingIdNum || Number.isNaN(buildingIdNum)) {
            setStructureStats(null);
            setStatsError('Не удалось определить здание для статистики');
            setStatsLoading(false);
            return;
        }

        setStatsLoading(true);
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
            await refetch();
        },
        refreshStatistics: loadStructureStats,
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
            render: (student: StudentsDto) => formatFullName(student) || '—',
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

    const handleFreeSlotClick = useCallback((room: RoomWithOccupants) => {
        prefillRoomSelection(room);
        closeBlockModal();
    }, [closeBlockModal, prefillRoomSelection]);

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
                    minHeight={380}
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
                                                    size='md'
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
                                                    <div className={`${styles.studentAvatar} ${styles.freeSlotAvatar}`}>
                                                        <i className="bi bi-plus"></i>
                                                    </div>
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
