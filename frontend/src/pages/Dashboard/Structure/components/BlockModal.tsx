import React, { useCallback, useMemo, useRef, useState } from 'react';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import ActionMenu, { type ActionMenuItem } from '../../../../components/ActionMenu/ActionMenu';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import type { StudentsDto } from '../../../../types/students';
import type { BlockWithRooms, RoomWithOccupants } from '../types';
import styles from '../Structure.module.css';
import { formatShortName, getGenderLabel, getInitials, getStatus } from '../utils';
import { getStudentImageSrc } from '../../../../utils/students';

type BlockModalProps = {
    activeBlock: BlockWithRooms | null;
    canManageRooms: boolean;
    canOpenFurniture: boolean;
    enableDragAndDrop: boolean;
    deletingRoomId: number | null;
    onClose: () => void;
    onDeleteRoom: (roomId: number, roomLabel: string) => void;
    onRoomFurnitureClick: (room: RoomWithOccupants) => void;
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
    canOpenFurniture,
    enableDragAndDrop,
    deletingRoomId,
    onClose,
    onDeleteRoom,
    onRoomFurnitureClick,
    onFreeSlotClick,
    onRoomDragOver,
    onRoomDrop,
    onStudentDragStart,
    onStudentDragEnd,
    onStudentCardClick,
}) => {
    const [openRoomMenuId, setOpenRoomMenuId] = useState<number | null>(null);
    const roomMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
    const activeBlockStatus = activeBlock ? getStatus(activeBlock.currentCapacity, activeBlock.capacity) : null;

    const closeRoomMenu = useCallback(() => {
        setOpenRoomMenuId(null);
        roomMenuTriggerRef.current = null;
    }, []);

    const toggleRoomMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>, roomId: number) => {
        event.stopPropagation();
        if (openRoomMenuId === roomId) {
            closeRoomMenu();
            return;
        }
        roomMenuTriggerRef.current = event.currentTarget;
        setOpenRoomMenuId(roomId);
    }, [closeRoomMenu, openRoomMenuId]);

    const handleDeleteClick = useCallback((roomId: number, roomLabel: string) => {
        closeRoomMenu();
        onDeleteRoom(roomId, roomLabel);
    }, [closeRoomMenu, onDeleteRoom]);

    const handleFurnitureClick = useCallback((room: RoomWithOccupants) => {
        closeRoomMenu();
        onClose();
        onRoomFurnitureClick(room);
    }, [closeRoomMenu, onClose, onRoomFurnitureClick]);

    const activeRoom = openRoomMenuId && activeBlock
        ? activeBlock.rooms.find(room => room.id === openRoomMenuId) ?? null
        : null;

    const roomMenuItems = useMemo<ActionMenuItem[]>(() => {
        if (!activeRoom) {
            return [];
        }

        return [
            ...(canOpenFurniture
                ? [{
                    label: 'Мебель',
                    icon: 'bi-lamp',
                    onClick: () => handleFurnitureClick(activeRoom),
                }]
                : []),
            {
                label: deletingRoomId === activeRoom.id ? 'Удаляем…' : 'Удалить',
                icon: 'bi-trash',
                variant: 'danger',
                onClick: () => handleDeleteClick(activeRoom.id, activeRoom.number),
                disabled: deletingRoomId === activeRoom.id,
            },
        ];
    }, [activeRoom, canOpenFurniture, closeRoomMenu, deletingRoomId, handleDeleteClick, handleFurnitureClick]);

    return (
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
                                {activeBlockStatus === 'occupied'
                                    ? 'Занят'
                                    : activeBlockStatus === 'free'
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
                                        <div className={styles.blockRoomMenu} onMouseDown={(event) => event.stopPropagation()}>
                                            <ActionButton
                                                variant="transparent-primary"
                                                size="sm"
                                                type="button"
                                                className={styles.blockRoomMenuButton}
                                                ariaLabel="Меню комнаты"
                                                onClick={(event) => toggleRoomMenu(event, room.id)}
                                                disabled={deletingRoomId === room.id}
                                            >
                                                <i className="bi bi-three-dots-vertical"></i>
                                            </ActionButton>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.studentsList}>
                                    {room.occupants.map(student => (
                                        <div
                                            key={student.id}
                                            className={styles.studentRow}
                                            draggable={canManageRooms && enableDragAndDrop}
                                            onDragStart={canManageRooms && enableDragAndDrop ? (event) => onStudentDragStart(event, student) : undefined}
                                            onDragEnd={canManageRooms && enableDragAndDrop ? onStudentDragEnd : undefined}
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
                                                        {student.group?.name ?? 'нет'} · {student.group?.course ?? 'нет'} курс
                                                    </p>
                                                </div>
                                            </div>
                                            <ActionButton
                                                variant="secondary"
                                                size="md"
                                                className={styles.studentCardButton}
                                                ariaLabel="Открыть карточку студента"
                                                onClick={() => onStudentCardClick(student.id)}
                                            >
                                                <i className={`bi bi-arrows-angle-expand ${styles.studentCardButtonIcon}`} aria-hidden="true"></i>
                                                <span className={styles.studentCardButtonText}>Карточка</span>
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
                                            onDragOver={canManageRooms && enableDragAndDrop ? onRoomDragOver : undefined}
                                            onDrop={canManageRooms && enableDragAndDrop ? (event) => onRoomDrop(event, room) : undefined}
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
            <ActionMenu
                isOpen={Boolean(activeRoom && roomMenuItems.length > 0)}
                anchorRef={roomMenuTriggerRef}
                items={roomMenuItems}
                onClose={closeRoomMenu}
                align="left"
            />
        </CommonModal>
    );
};

export default BlockModal;
