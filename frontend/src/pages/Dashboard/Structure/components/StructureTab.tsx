import React from 'react';
import SelectField from '../../../../components/SelectField/SelectField';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import type { BlockWithRooms, FloorWithBlocks, RoomStatus } from '../types';
import type { StudentsDto } from '../../../../types/students';
import styles from '../Structure.module.css';

export type SelectOption = { value: string; label: string };

interface StructureTabHeaderProps {
    studentValue: string;
    floorValue: string;
    blockValue: string;
    studentOptions: SelectOption[];
    floorOptions: SelectOption[];
    blockOptions: SelectOption[];
    onStudentChange: (value: string) => void;
    onFloorChange: (value: string) => void;
    onBlockChange: (value: string) => void;
    onReset: () => void;
}

export const StructureTabHeader: React.FC<StructureTabHeaderProps> = ({
    studentValue,
    floorValue,
    blockValue,
    studentOptions,
    floorOptions,
    blockOptions,
    onStudentChange,
    onFloorChange,
    onBlockChange,
    onReset,
}) => (
    <div className={styles.searchSection}>
        <div className={styles.filtersGrid}>
            <SelectField
                label="Студент"
                value={studentValue}
                onChange={(e) => onStudentChange(e.target.value)}
                options={studentOptions}
            />
            <SelectField
                label="Этаж"
                value={floorValue}
                onChange={(e) => onFloorChange(e.target.value)}
                options={floorOptions}
            />
            <SelectField
                label="Блок"
                value={blockValue}
                onChange={(e) => onBlockChange(e.target.value)}
                options={blockOptions}
            />
            <ActionButton
                variant='secondary'
                size='md'
                onClick={onReset}
                className={styles.resetButton}
            >
                Сбросить
            </ActionButton>
        </div>
    </div>
);

interface StructureTabContentProps {
    statsLoading: boolean;
    statsError: string | null;
    floors: FloorWithBlocks[];
    canManageRooms: boolean;
    onAddRoom: (floorNumber?: number) => void;
    onOpenBlockModal: (block: BlockWithRooms) => void;
    getStatus: (currentCapacity: number, capacity: number) => RoomStatus;
    formatShortName: (student: StudentsDto) => string;
    getGenderLabel: (entity: BlockWithRooms) => string;
}

export const StructureTabContent: React.FC<StructureTabContentProps> = ({
    statsLoading,
    statsError,
    floors,
    canManageRooms,
    onAddRoom,
    onOpenBlockModal,
    getStatus,
    formatShortName,
    getGenderLabel,
}) => (
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
                        onClick={() => onAddRoom()}
                        className={styles.fullWidthMobileButton}
                    >
                        <span className="me-2">+</span>
                        Добавить
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
                                    variant='light'
                                    size='md'
                                    className={styles.addRoomButton}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onAddRoom(floor.floor);
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <i className="bi bi-plus"></i>
                                        <span>Добавить</span>
                                    </div>
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
                                    onClick={() => onOpenBlockModal(block)}
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
                                                onOpenBlockModal(block);
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
