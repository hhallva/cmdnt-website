// src/pages/Dashboard/Students/components/HousingInfoTab.tsx
import React from 'react';
import type { StudentsDto } from '../../../../types/students';
import type { RoomDto } from '../../../../types/rooms';
import styles from '../StudentCard.module.css';

interface HousingInfoTabProps {
    room: RoomDto | null;
    neighbours: StudentsDto[];
    student: StudentsDto;
    loading: boolean;
    error: string | null;
}

const HousingInfoTab: React.FC<HousingInfoTabProps> = ({ room, neighbours, student, loading, error }) => {
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

    const filteredNeighbours = neighbours.filter((n) => n.id !== student.id);

    return (
        <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Текущее проживание</h3>
                <div className={styles.housingInfo}>
                    <div className={styles.housingIcon}>
                        <i className="bi bi-building"></i>
                    </div>
                    <div className={styles.housingDetails}>
                        <h4>Блок {room.roomNumber || 'Нет данных'}</h4>
                        <p>Вместимость: {room.capacity || 0}</p>
                        <p>Этаж {room.floorNumber || 'Нет данных'}</p>
                    </div>
                </div>

                <div className={styles.infoItem}>
                    <h3 className={styles.infoLabel}>Соседи по комнате</h3>
                    {filteredNeighbours.length > 0 ? (
                        filteredNeighbours.map((neighbour) => (
                            <div key={neighbour.id} className={styles.infoValue}>
                                {neighbour.surname} {neighbour.name} {neighbour.patronymic} ({neighbour.group?.name || '—'})
                            </div>
                        ))
                    ) : (
                        'Нет соседей'
                    )}
                </div>
            </div>
        </div>
    );
};

export default HousingInfoTab;