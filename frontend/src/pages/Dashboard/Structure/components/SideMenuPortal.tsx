import React from 'react';
import { createPortal } from 'react-dom';
import type { StudentsDto } from '../../../../types/students';
import styles from '../Structure.module.css';
import { formatShortName, getInitials } from '../utils';
import { getStudentImageSrc } from '../../../../utils/students';

type SideMenuPortalProps = {
    isActive: boolean;
    isOpen: boolean;
    students: StudentsDto[];
    onToggle: () => void;
    onClose: () => void;
    onStudentSelect: (student: StudentsDto) => void;
    onDragStart: (event: React.DragEvent<HTMLButtonElement>, studentId: number) => void;
    onDragEnd: (event: React.DragEvent<HTMLButtonElement>) => void;
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
};

const SideMenuPortal: React.FC<SideMenuPortalProps> = ({
    isActive,
    isOpen,
    students,
    onToggle,
    onClose,
    onStudentSelect,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
}) => {
    if (!isActive || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <>
            <button
                type="button"
                className={styles.blockMenuButton}
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls="structure-block-menu"
            >
                <i className="bi bi-list" aria-hidden="true"></i>
            </button>
            <aside
                id="structure-block-menu"
                className={`${styles.sideMenu} ${isOpen ? styles.sideMenuOpen : ''}`}
                aria-hidden={!isOpen}
            >
                <div className={styles.sideMenuHeader}>
                    <span className={styles.sideMenuTitle}>Заселение</span>
                    <button
                        type="button"
                        className={styles.sideMenuClose}
                        onClick={onClose}
                        aria-label="Закрыть меню"
                    >
                        ×
                    </button>
                </div>
                <div className={styles.sideMenuBody}>
                    <div
                        className={styles.sideMenuList}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                    >
                        {students.length > 0 ? (
                            students.map(student => (
                                <button
                                    key={student.id}
                                    type="button"
                                    className={styles.sideMenuCard}
                                    onClick={() => onStudentSelect(student)}
                                    draggable
                                    onDragStart={(event) => onDragStart(event, student.id)}
                                    onDragEnd={onDragEnd}
                                >
                                    <div className={styles.sideMenuAvatar}>
                                        {getStudentImageSrc(student.image) ? (
                                            <img
                                                src={getStudentImageSrc(student.image) ?? ''}
                                                alt={student.surname || 'Фотография студента'}
                                            />
                                        ) : (
                                            <span>{getInitials(student) || '—'}</span>
                                        )}
                                    </div>
                                    <div className={styles.sideMenuCardInfo}>
                                        <p className={styles.sideMenuName}>{formatShortName(student)}</p>
                                        <p className={styles.sideMenuMeta}>
                                            Группа {student.group?.name ?? '—'}, {student.group?.course ?? '—'} курс
                                        </p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className={styles.sideMenuEmpty}>Нет свободных студентов.</p>
                        )}
                    </div>
                </div>
            </aside>
        </>
        ,
        document.body
    );
};

export default SideMenuPortal;
