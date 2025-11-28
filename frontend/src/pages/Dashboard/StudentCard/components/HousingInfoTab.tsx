import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StudentsDto } from '../../../../types/students';
import type { RoomDto } from '../../../../types/rooms';
import styles from '../StudentCard.module.css';
import ActionButton from '../../../../components/ActionButton/ActionButton';

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
    const occupants = useMemo(() => {
        const uniqueNeighbours = neighbours.filter((n) => n.id !== student.id);
        return [student, ...uniqueNeighbours];
    }, [neighbours, student]);

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
        return <div className="alert text-center">Студент не заселен.</div>;
    }

    const blockStatus = getRoomStatus(room.currentCapacity, room.capacity);

    return (

        <div className={styles.housingCardWrapper}>
            <div className={`${styles.housingCard} ${blockStatus === 'occupied' ? styles.housingCardOccupied : ''}`}>
                <div className={styles.blockHeader}>
                    <p className={styles.blockNumber}>
                        <span className={styles.blockNumberBadge}>{room.roomNumber}</span>
                    </p>
                    <div className={styles.blockMetaColumn}>
                        <p className={styles.blockMeta}>
                            <span className={styles.blockMetaLabel}>Тип</span>
                            <span className={styles.blockMetaValue}>{getGenderLabel(room.genderType)}</span>
                        </p>
                        <p className={styles.blockMeta}>
                            <span className={styles.blockMetaLabel}>Заселено</span>
                            <span className={styles.blockMetaValue}>{room.currentCapacity}/{room.capacity}</span>
                        </p>
                    </div>
                </div>

                <div className={styles.housingOccupantsGrid}>
                    {occupants.map((occupant) => (
                        <div key={occupant.id} className={styles.housingOccupantRow}>
                            <div className={styles.housingOccupantInfo}>
                                <div className={styles.housingOccupantAvatar}>{getInitials(occupant)}</div>
                                <div>
                                    {formatShortName(occupant)}
                                    <p className={styles.housingOccupantMeta}>
                                        {occupant.group?.name ?? '—'} · {occupant.group?.course ?? '—'} курс
                                    </p>
                                </div>
                            </div>
                            <div className={styles.housingOccupantActions}>
                                {occupant.id === student.id ? (
                                    <></>
                                ) : (
                                    <ActionButton
                                        variant='secondary'
                                        size='sm'
                                        className={styles.studentCardButton}
                                        onClick={() => navigate(`/dashboard/students/${occupant.id}`)}
                                    >
                                        Карточка
                                    </ActionButton>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default HousingInfoTab;