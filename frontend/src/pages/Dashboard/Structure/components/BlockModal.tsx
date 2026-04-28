import React from 'react';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import type { StudentsDto } from '../../../../types/students';
import type { BlockWithRooms, RoomWithOccupants } from '../types';
import styles from '../Structure.module.css';
import { formatShortName, getGenderLabel, getInitials, getStatus } from '../utils';
import { getStudentImageSrc } from '../../../../utils/students';

type BlockModalProps = {
    activeBlock: BlockWithRooms | null;
    canManageRooms: boolean;
    deletingRoomId: number | null;
    onClose: () => void;
    onDeleteRoom: (roomId: number, roomLabel: string) => void;
    onFreeSlotClick: (room: RoomWithOccupants) => void;
    onRoomDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    onRoomDrop: (event: React.DragEvent<HTMLDivElement>, room: RoomWithOccupants) => void;
    onStudentDragStart: (event: React.DragEvent<HTMLDivElement>, student: StudentsDto) => void;
    onStudentDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
    onStudentCardClick: (studentId: number) => void;
};

const BlockModal: React.FC<BlockModalProps> = ({
    activeBlock,
    canManageRooms,
    deletingRoomId,
    onClose,
    onDeleteRoom,
    onFreeSlotClick,
    onRoomDragOver,
    onRoomDrop,
    onStudentDragStart,
    onStudentDragEnd,
    onStudentCardClick,
}) => (
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
                        <span className={styles.blockMetaValue}>
                            {getStatus(activeBlock.currentCapacity, activeBlock.capacity) === 'occupied'
                                ? 'Занят'
                                : getStatus(activeBlock.currentCapacity, activeBlock.capacity) === 'free'
                                    ? 'Свободен'
                                    : 'Частично занят'}
                        </span>
                    </p>
                    <p className={styles.blockMeta}>
                        <span className={styles.blockMetaLabel}>Заселено</span>
                        <span className={styles.blockMetaValue}>
                            {activeBlock.currentCapacity}/{activeBlock.capacity}
                        </span>
                    </p>
                </div>
            </div>
        )}
        isOpen={Boolean(activeBlock)}
        onClose={onClose}
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
                                        variant="transparent-primary"
                                        size="sm"
                                        type="button"
                                        className={styles.blockRoomDeleteButton}
                                        disabled={deletingRoomId === room.id}
                                        onClick={() => onDeleteRoom(room.id, room.roomNumber)}
                                    >
                                        {deletingRoomId === room.id ? 'Удаляем…' : 'Удалить'}
                                    </ActionButton>
                                )}
                            </div>
                            <div className={styles.studentsList}>
                                {room.occupants.map(student => (
                                    <div
                                        key={student.id}
                                        className={styles.studentRow}
                                        draggable={canManageRooms}
                                        onDragStart={canManageRooms ? (event) => onStudentDragStart(event, student) : undefined}
                                        onDragEnd={canManageRooms ? onStudentDragEnd : undefined}
                                    >
                                        <div className={styles.studentInfo}>
                                            <div className={styles.studentAvatar}>
                                                {getStudentImageSrc(student.image) ? (
                                                    <img
                                                        src={getStudentImageSrc(student.image) ?? ''}
                                                        alt={student.surname || 'Фотография студента'}
                                                    />
                                                ) : (
                                                    getInitials(student)
                                                )}
                                            </div>
                                            <div>
                                                <p className={styles.studentName}>{formatShortName(student)}</p>
                                                <p className={styles.studentMeta}>
                                                    {student.group?.name ?? '—'} · {student.group?.course ?? '—'} курс
                                                </p>
                                            </div>
                                        </div>
                                        <ActionButton
                                            variant="secondary"
                                            size="md"
                                            className={styles.studentCardButton}
                                            onClick={() => onStudentCardClick(student.id)}
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
                                        onClick={() => onFreeSlotClick(room)}
                                        onDragOver={canManageRooms ? onRoomDragOver : undefined}
                                        onDrop={canManageRooms ? (event) => onRoomDrop(event, room) : undefined}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                onFreeSlotClick(room);
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
);

export default BlockModal;
