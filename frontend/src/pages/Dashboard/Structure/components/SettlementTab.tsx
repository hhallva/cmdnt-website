import React from 'react';
import SelectField from '../../../../components/SelectField/SelectField';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonTable, { type ColumnDefinition, type RowActionConfig } from '../../../../components/CommonTable/CommonTable';
import type { StudentsDto } from '../../../../types/students';
import type { SettlementFormErrors, SettlementFormState } from '../types';
import styles from '../Structure.module.css';

export type SelectOption = { value: string; label: string };

interface SettlementTabHeaderProps {
    form: SettlementFormState;
    errors: SettlementFormErrors;
    studentOptions: SelectOption[];
    floorOptions: SelectOption[];
    roomOptions: SelectOption[];
    isSettling: boolean;
    isStudentDisabled: boolean;
    isRoomDisabled: boolean;
    isSubmitDisabled: boolean;
    onStudentChange: (value: string) => void;
    onFloorChange: (value: string) => void;
    onRoomChange: (value: string) => void;
    onReset: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const SettlementTabHeader: React.FC<SettlementTabHeaderProps> = ({
    form,
    errors,
    studentOptions,
    floorOptions,
    roomOptions,
    isSettling,
    isStudentDisabled,
    isRoomDisabled,
    isSubmitDisabled,
    onStudentChange,
    onFloorChange,
    onRoomChange,
    onReset,
    onSubmit,
}) => (
    <section className={styles.settlementCard}>
        <form className={styles.settlementForm} onSubmit={onSubmit}>
            <div className={styles.settlementFormGrid}>
                <SelectField
                    label="Студент"
                    value={form.studentId}
                    onChange={(e) => onStudentChange(e.target.value)}
                    options={studentOptions}
                    disabled={isStudentDisabled}
                    error={errors.studentId}
                />
                <SelectField
                    label="Этаж"
                    value={form.floorNumber}
                    onChange={(e) => onFloorChange(e.target.value)}
                    options={floorOptions}
                    disabled={isRoomDisabled}
                />
                <SelectField
                    label="Комната"
                    value={form.roomId}
                    onChange={(e) => onRoomChange(e.target.value)}
                    options={roomOptions}
                    disabled={isRoomDisabled}
                    error={errors.roomId}
                />
            </div>
            <div className={styles.settlementActions}>
                <ActionButton
                    variant='secondary'
                    size='md'
                    type='button'
                    className={styles.fullWidthMobileButton}
                    onClick={onReset}
                    disabled={isSettling}
                >
                    Сбросить
                </ActionButton>
                <ActionButton
                    variant='primary'
                    size='md'
                    type='submit'
                    style={{ minWidth: '212px' }}
                    className={styles.fullWidthMobileButton}
                    disabled={isSubmitDisabled}
                >
                    {isSettling ? 'Заселяем…' : 'Заселить'}
                </ActionButton>
            </div>
        </form>
    </section>
);

interface SettlementTabContentProps {
    students: StudentsDto[];
    columns: ColumnDefinition<StudentsDto>[];
    rowAction: RowActionConfig<StudentsDto>;
    enableSorting?: boolean;
    onSortRequest?: (key: string) => void;
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
    formatFullName: (student: StudentsDto) => string;
    formatBirthday: (birthday?: string | null) => string;
    getStudentGenderLabel: (gender: StudentsDto['gender']) => string;
    onStudentSelect?: (student: StudentsDto) => void;
}

export const SettlementTabContent: React.FC<SettlementTabContentProps> = ({
    students,
    columns,
    rowAction,
    enableSorting,
    onSortRequest,
    sortConfig,
    formatFullName,
    formatBirthday,
    getStudentGenderLabel,
    onStudentSelect,
}) => (
    <>
        <div className={styles.desktopTable}>
            <CommonTable
                data={students}
                columns={columns}
                emptyMessage="Все студенты уже заселены"
                rowAction={rowAction}
                className={styles.tablePlain}
                enableSorting={enableSorting}
                onSortRequest={onSortRequest}
                sortConfig={sortConfig}
                onRowClick={onStudentSelect}
            />
        </div>
        <div className={styles.mobileCardsWrapper}>
            {students.length ? (
                students.map(student => (
                    <div
                        key={student.id}
                        className={styles.mobileCard}
                        role="button"
                        tabIndex={0}
                        onClick={() => onStudentSelect?.(student)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onStudentSelect?.(student);
                            }
                        }}
                    >
                        <div className={styles.mobileCardHeader}>
                            <p className={styles.mobileCardTitle}>{formatFullName(student) || '—'}</p>
                            {rowAction.onClick && (
                                <button
                                    type="button"
                                    className={styles.mobileCardActionButton}
                                    aria-label="Открыть карточку студента"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        rowAction.onClick?.(student);
                                    }}
                                >
                                    <i className={`bi ${rowAction.icon}`}></i>
                                </button>
                            )}
                        </div>
                        <div className={styles.mobileCardDivider}></div>
                        <div className={styles.mobileCardRow}>
                            <div className={styles.blockMetaColumn}>
                                <div className={styles.blockMeta}>
                                    <span className={styles.blockMetaLabel}>Группа</span>
                                    <span className={styles.blockMetaValue}>{student.group?.name ?? '—'}</span>
                                </div>
                                <div className={styles.blockMeta}>
                                    <span className={styles.blockMetaLabel}>Телефон</span>
                                    <span className={styles.blockMetaValue}>{student.phone ?? '—'}</span>
                                </div>
                                <div className={styles.blockMeta}>
                                    <span className={styles.blockMetaLabel}>Рожден</span>
                                    <span className={styles.blockMetaValue}>{formatBirthday(student.birthday)}</span>
                                </div>
                            </div>
                            <div className={styles.blockMetaColumn}>
                                <div className={styles.blockMeta}>
                                    <span className={styles.blockMetaLabel}>Курс</span>
                                    <span className={styles.blockMetaValue}>{student.group?.course ?? '—'}</span>
                                </div>
                                <div className={styles.blockMeta}>
                                    <span className={styles.blockMetaLabel}>Пол</span>
                                    <span className={styles.blockMetaValue}>{getStudentGenderLabel(student.gender)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className={styles.mobileCardsEmpty}>Все студенты уже заселены</div>
            )}
        </div>
    </>
);
