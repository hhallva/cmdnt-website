import React, { useMemo } from 'react';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import styles from '../StudentCard.module.css';
import type { ResettlementHistoryDto } from '../../../../types/resettlements';

type HistoryModalProps = {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;
    items: ResettlementHistoryDto[];
    onStudentClick: (studentId: number) => void;
    onDeleteResettlement: (resettlementId: number) => void;
    formatDate: (value: string) => string;
    canDelete: boolean;
};

const getInitialsFromFullName = (fullName: string): string => {
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length === 0) {
        return '—';
    }
    const first = parts[0]?.charAt(0) ?? '';
    const second = parts[1]?.charAt(0) ?? '';
    return `${first}${second}`.toUpperCase() || '—';
};

const getAcademicYearStart = (value: string): number => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return new Date().getFullYear();
    }
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 8 ? year : year - 1;
};

const formatAcademicYear = (startYear: number): string => `${startYear} – ${startYear + 1}`;

const HistoryModal: React.FC<HistoryModalProps> = ({
    isOpen,
    onClose,
    isLoading,
    isLoaded,
    error,
    items,
    onStudentClick,
    onDeleteResettlement,
    formatDate,
    canDelete,
}) => {
    const currentAcademicYearStart = getAcademicYearStart(new Date().toISOString());

    const groupedItems = useMemo(() => {
        const groups = new Map<number, ResettlementHistoryDto[]>();
        items.forEach((item) => {
            const startYear = getAcademicYearStart(item.checkInDate);
            const group = groups.get(startYear) ?? [];
            group.push(item);
            groups.set(startYear, group);
        });

        return Array.from(groups.entries())
            .sort((a, b) => b[0] - a[0])
            .map(([startYear, groupItems]) => ({
                startYear,
                label: formatAcademicYear(startYear),
                items: groupItems,
            }));
    }, [items]);

    return (
        <CommonModal
            title="История проживания"
            isOpen={isOpen}
            onClose={onClose}
            minWidth={620}
        >
            {!isLoaded && isLoading && (
                <div className={`d-flex justify-content-center align-items-center ${styles.historyLoading}`}>
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </div>
                </div>
            )}
            {!isLoading && error && (
                <div className={styles.historyEmpty}>
                    <i className="bi bi-journal" aria-hidden="true" />
                    <div className={styles.historyEmptyText}>{error}</div>
                </div>
            )}
            {isLoaded && !error && items.length === 0 && (
                <div className={styles.historyEmpty}>
                    <i className="bi bi-journal" aria-hidden="true" />
                    <div className={styles.historyEmptyText}>История проживания отсутствует</div>
                </div>
            )}
            {isLoaded && !error && items.length > 0 && (
                <div className={styles.historyFolders}>
                    {groupedItems.map((group) => (
                        <details
                            key={group.startYear}
                            className={styles.historyFolder}
                            open={group.startYear === currentAcademicYearStart}
                        >
                            <summary className={styles.historyFolderSummary}>
                                <i className={`bi bi-chevron-down ${styles.historyFolderIcon}`} aria-hidden="true" />
                                <span className={styles.historyFolderLabel}>{group.label}</span>
                            </summary>
                            <div className={styles.historyFolderContent}>
                                {group.items.map((item) => (
                                    <details key={`${item.roomId}-${item.checkInDate}`} className={styles.historyPeriod}>
                                        <summary className={styles.historyPeriodSummary}>
                                            <i className={`bi bi-chevron-down ${styles.historyPeriodIcon}`} aria-hidden="true" />
                                            <span className={styles.historyPeriodLabel}>
                                                {formatDate(item.checkInDate)} – {formatDate(item.checkOutDate)}
                                            </span>
                                            {canDelete && (
                                                <ActionButton
                                                    variant="transparent-primary"
                                                    size="md"
                                                    className={styles.historyPeriodDelete}
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        if (!window.confirm('Удалить запись проживания?')) {
                                                            return;
                                                        }
                                                        onDeleteResettlement(item.resettlementId);
                                                    }}
                                                >
                                                    Удалить
                                                </ActionButton>
                                            )}
                                        </summary>
                                        <div className={styles.historyPeriodContent}>
                                            <div className={styles.historyItem}>
                                                <div className={styles.historyRoomHeader}>
                                                    <div className={styles.historyRoomTitle}>
                                                        Комната {item.roomNumber} ({item.capacity})
                                                    </div>
                                                </div>
                                                {item.roommates.length > 0 ? (
                                                    <div className={styles.historyRoomList}>
                                                        {item.roommates.map((mate) => (
                                                            <div key={`${mate.id}-${mate.fullName}`} className={styles.historyRoommateRow}>
                                                                <div className={styles.historyRoommateInfo}>
                                                                    <div className={styles.historyRoommateAvatar}>
                                                                        {getInitialsFromFullName(mate.fullName)}
                                                                    </div>
                                                                    <div className={styles.historyRoommateText}>
                                                                        <div className={styles.historyRoommateName}>{mate.fullName}</div>
                                                                        <div className={styles.historyRoommateMeta}>
                                                                            {mate.groupName ?? '—'} · {mate.groupCourse ?? '—'} курс
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <ActionButton
                                                                    variant="secondary"
                                                                    size="md"
                                                                    className={styles.studentCardButton}
                                                                    onClick={() => onStudentClick(mate.id)}
                                                                >
                                                                    Карточка
                                                                </ActionButton>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className={styles.historyRoommatesEmpty}>Без соседей</div>
                                                )}
                                            </div>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </details>
                    ))}
                </div>
            )}
        </CommonModal>
    );
};

export default HistoryModal;
