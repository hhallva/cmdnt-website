import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StudentsDto } from '../../../../types/students';
import type { RoomDto } from '../../../../types/rooms';
import styles from '../StudentCard.module.css';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import { getStudentImageSrc } from '../../../../utils/students';
import HistoryModal from './HistoryModal';
import { apiClient } from '../../../../api/client';
import type { ResettlementHistoryDto } from '../../../../types/resettlements';
import type { UserSession } from '../../../../types/UserSession';

type RoomStatus = 'occupied' | 'partial' | 'free';

const getRoomStatus = (current: number, capacity: number): RoomStatus => {
    if (current <= 0) {
        return 'free';
    }
    if (current >= capacity) {
        return 'occupied';
    }
    return 'partial';
};

const getGenderLabel = (gender: RoomDto['genderType']) => {
    if (gender === null) return 'Не задан';
    return gender ? 'Мужская' : 'Женская';
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


interface HousingInfoTabProps {
    room: RoomDto | null;
    neighbours: StudentsDto[];
    student: StudentsDto;
    loading: boolean;
    error: string | null;
}

const HousingInfoTab: React.FC<HousingInfoTabProps> = ({ room, neighbours, student, loading, error }) => {
    const navigate = useNavigate();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [historyItems, setHistoryItems] = useState<ResettlementHistoryDto[]>([]);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const userSessionStr = sessionStorage.getItem('userSession');
    const userSession: UserSession | null = userSessionStr ? JSON.parse(userSessionStr) : null;
    const roleName = userSession?.role?.name?.toLowerCase() ?? '';
    const canDeleteHistory = roleName.includes('администратор') || roleName.includes('комендант');
    const occupants = useMemo(() => {
        const uniqueNeighbours = neighbours.filter((n) => n.id !== student.id);
        return [student, ...uniqueNeighbours];
    }, [neighbours, student]);

    useEffect(() => {
        setHistoryItems([]);
        setHistoryError(null);
        setHistoryLoaded(false);
        setHistoryLoading(false);
    }, [student.id]);

    useEffect(() => {
        if (!isHistoryOpen) {
            setHistoryLoading(false);
        }
    }, [isHistoryOpen]);

    useEffect(() => {
        if (!isHistoryOpen || historyLoaded) {
            return;
        }

        let isActive = true;

        setHistoryLoading(true);
        setHistoryError(null);

        apiClient.getStudentResettlementHistory(student.id)
            .then((data) => {
                if (!isActive) {
                    return;
                }
                setHistoryItems(data);
            })
            .catch((err: any) => {
                if (!isActive) {
                    return;
                }
                setHistoryError(err?.message || 'Не удалось загрузить историю проживания');
            })
            .finally(() => {
                if (isActive) {
                    setHistoryLoaded(true);
                    setHistoryLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [isHistoryOpen, historyLoaded, student.id]);

    const formatDate = (value: string) => {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return '—';
        }
        return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed);
    };

    const handleDeleteResettlement = async (resettlementId: number) => {
        try {
            await apiClient.deleteStudentResettlement(student.id, resettlementId);
            setHistoryItems((prev) => prev.filter((item) => item.resettlementId !== resettlementId));
        } catch (err: any) {
            setHistoryError(err?.message || 'Не удалось удалить запись проживания');
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Загрузка комнаты...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-info text-center">{error}</div>;
    }

    if (!room) {
        return <>
            <div className={styles.emptyState} style={{ marginBottom: '1.5rem' }}>
                <i className="bi bi-emoji-frown"></i>
                <p>Студент не заселен</p>
                <ActionButton
                    variant="secondary"
                    size="md"
                    className={styles.housingHistoryButton}
                    onClick={() => setIsHistoryOpen(true)}
                >
                    История
                </ActionButton>
            </div>
            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                isLoading={historyLoading}
                isLoaded={historyLoaded}
                error={historyError}
                items={historyItems}
                formatDate={formatDate}
                onStudentClick={(studentId) => navigate(`/dashboard/students/${studentId}`)}
                onDeleteResettlement={handleDeleteResettlement}
                canDelete={canDeleteHistory}
            />
        </>;
    }

    const blockStatus = getRoomStatus(room.currentCapacity, room.capacity);

    return (
        <div className={styles.housingCardWrapper}>
            <div className={`${styles.housingCard} ${blockStatus === 'occupied' ? styles.housingCardOccupied : ''}`}>
                <div className={styles.blockHeader}>
                    <p className={styles.blockNumber}>
                        <span className={styles.blockNumberBadge}>{room.roomNumber}</span>
                    </p>
                    <div className={styles.groupMeta}>
                        <div className={styles.blockMeta}>
                            <span className={styles.blockMetaLabel}>Тип</span>
                            <span className={styles.blockMetaValue}>{getGenderLabel(room.genderType)}</span>
                        </div>
                        <div className={styles.blockMeta}>
                            <span className={styles.blockMetaLabel}>Заселено</span>
                            <span className={styles.blockMetaValue}>{room.currentCapacity}/{room.capacity}</span>
                        </div>
                    </div>
                    <div className={styles.blockHeaderActions}>
                        <ActionButton
                            variant="transparent-primary"
                            size="md"
                            className={styles.housingHistoryButton}
                            onClick={() => setIsHistoryOpen(true)}
                        >
                            История
                        </ActionButton>
                    </div>
                </div>

                <div className={styles.housingOccupantsGrid}>
                    {occupants.map((occupant) => {
                        const occupantImageSrc = getStudentImageSrc(occupant.image);
                        return (
                            <div key={occupant.id} className={styles.housingOccupantRow}>
                                <div className={styles.housingOccupantInfo}>
                                    <div className={styles.housingOccupantAvatar}>
                                        {occupantImageSrc ? (
                                            <img src={occupantImageSrc} alt={occupant.surname || 'Фотография студента'} />
                                        ) : (
                                            getInitials(occupant)
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <div className={styles.housingOccupantFIO}>{formatShortName(occupant)}</div>
                                        <div className={styles.housingOccupantMeta}>
                                            {occupant.group?.name ?? '—'} · {occupant.group?.course ?? '—'} курс
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.housingOccupantActions}>
                                    {occupant.id === student.id ? (
                                        <></>
                                    ) : (
                                        <ActionButton
                                            variant='secondary'
                                            size='md'
                                            className={styles.studentCardButton}
                                            onClick={() => navigate(`/dashboard/students/${occupant.id}`)}
                                        >
                                            Карточка
                                        </ActionButton>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                isLoading={historyLoading}
                isLoaded={historyLoaded}
                error={historyError}
                items={historyItems}
                formatDate={formatDate}
                onStudentClick={(studentId) => navigate(`/dashboard/students/${studentId}`)}
                onDeleteResettlement={handleDeleteResettlement}
                canDelete={canDeleteHistory}
            />
        </div >
    );
};

export default HousingInfoTab;