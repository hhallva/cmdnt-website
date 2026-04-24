import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StudentsDto } from '../../../../types/students';
import type { RoomDto } from '../../../../types/rooms';
import styles from '../StudentCard.module.css';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import { getStudentImageSrc } from '../../../../utils/students';

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
        return <>
            <div className={styles.emptyState} style={{ marginBottom: '1.5rem' }}>
                <i className="bi bi-emoji-frown"></i>
                <p>Студент не заселен</p>
            </div>
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
        </div >
    );
};

export default HousingInfoTab;