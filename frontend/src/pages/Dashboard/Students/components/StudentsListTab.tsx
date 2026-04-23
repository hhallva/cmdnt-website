import React, { useMemo, useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { StudentsDto } from '../../../../types/students';
import type { GroupDto } from '../../../../types/groups';
import type { BuildingDto } from '../../../../types/buildings';

import CommonTable from '../../../../components/CommonTable/CommonTable';
import InputField from '../../../../components/InputField/InputField';
import SelectField from '../../../../components/SelectField/SelectField';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import { IMPORT_EXPECTED_HEADERS } from '../constants';
import {
    formatBirthday,
    formatBirthdayForExport,
    formatGenderShort,
    getGenderLabel,
} from '../../../../utils/students';

import styles from '../Students.module.css';

interface StudentsListTabProps {
    students: StudentsDto[];
    groups: GroupDto[];
    buildings: BuildingDto[];
    selectedBuildingId: number | 'unassigned' | null;
    searchTerm: string;
    selectedGroupId: number | 'all';
    selectedCourse: number | 'all';
    selectedGender: 'male' | 'female' | 'all';
    isEducator: boolean;
    onExportReady?: (handler: (() => void) | null) => void;
    onStudentClick: (studentId: number) => void;
}

interface StudentsListFiltersProps {
    groups: GroupDto[];
    buildings: BuildingDto[];
    searchTerm: string;
    selectedGroupId: number | 'all';
    selectedCourse: number | 'all';
    selectedGender: 'male' | 'female' | 'all';
    selectedBuildingId: number | 'unassigned' | null;
    isAdvancedFilterOpen: boolean;
    isEducator: boolean;
    onSearchTermChange: (value: string) => void;
    onGroupChange: (value: number | 'all') => void;
    onCourseChange: (value: number | 'all') => void;
    onGenderChange: (value: 'male' | 'female' | 'all') => void;
    onBuildingChange: (buildingId: number | 'unassigned' | null) => void;
    onToggleAdvancedFilters: () => void;
    onResetFilters: () => void;
    onExport: () => void;
}

export const StudentsListFilters: React.FC<StudentsListFiltersProps> = ({
    groups,
    buildings,
    searchTerm,
    selectedGroupId,
    selectedCourse,
    selectedGender,
    selectedBuildingId,
    isAdvancedFilterOpen,
    isEducator,
    onSearchTermChange,
    onGroupChange,
    onCourseChange,
    onGenderChange,
    onBuildingChange,
    onToggleAdvancedFilters,
    onResetFilters,
    onExport,
}) => {
    const uniqueCourses = useMemo(() => {
        const courses = new Set<number>();
        groups.forEach(group => {
            if (group.course) courses.add(group.course);
        });
        return Array.from(courses).sort((a, b) => a - b);
    }, [groups]);

    const sortedGroups = useMemo(() => (
        [...groups].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ru', { sensitivity: 'base' }))
    ), [groups]);

    const groupOptions = useMemo(() => [
        { value: 'all', label: 'Все группы' },
        ...sortedGroups.map(group => ({ value: group.id, label: group.name })),
    ], [sortedGroups]);

    const courseOptions = useMemo(() => [
        { value: 'all', label: 'Все курсы' },
        ...uniqueCourses.map(course => ({ value: course, label: `${course} курс` })),
    ], [uniqueCourses]);

    const genderOptions = [
        { value: 'all', label: 'Любой пол' },
        { value: 'male', label: 'Мужской' },
        { value: 'female', label: 'Женский' },
    ];

    return (
        <div className={`${styles.searchPanel} `}>
            <div className={styles.searchPanelRow}>
                <div className={styles.searchLeft}>
                    <div className={styles.searchInputWrapper}>
                        <InputField
                            label=""
                            type="text"
                            placeholder="Поиск по ФИО..."
                            value={searchTerm}
                            onChange={(event) => onSearchTermChange(event.target.value)}
                        />
                    </div>
                    <div className={styles.searchButtons}>
                        <ActionButton
                            variant="secondary"
                            size="md"
                            onClick={onToggleAdvancedFilters}
                            className={`${styles.modilButton} ${styles.filtersButton}`}
                            aria-expanded={isAdvancedFilterOpen}
                        >
                            Фильтры
                            <i className={`bi ${isAdvancedFilterOpen ? 'bi-chevron-up' : 'bi-chevron-down'} ms-2`}></i>
                        </ActionButton>
                        <ActionButton
                            variant="secondary"
                            size="md"
                            onClick={onResetFilters}
                            className={`${styles.modilButton} ${styles.resetButton}`}
                        >
                            Сбросить
                        </ActionButton>
                    </div>
                </div>
                {!isEducator && (
                    <div className={styles.searchRight}>
                        <ActionButton
                            size="md"
                            variant="primary"
                            onClick={onExport}
                            className={styles.fullWidthMobileButton}
                        >
                            <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                            Скачать Excel
                        </ActionButton>
                    </div>
                )}
            </div>

            {isAdvancedFilterOpen && (
                <div id="advancedFilters" className={`collapse show ${styles.advancedFiltersPanel}`}>
                    <div className={styles.filtersGrid}>
                        <SelectField
                            label="Здание"
                            value={selectedBuildingId ?? ''}
                            onChange={(event) => {
                                const value = event.target.value;
                                if (!value) {
                                    onBuildingChange(null);
                                    return;
                                }
                                if (value === 'unassigned') {
                                    onBuildingChange('unassigned');
                                    return;
                                }
                                onBuildingChange(Number(value));
                            }}
                            options={[
                                { value: '', label: buildings.length ? 'Все здания' : 'Здания не найдены' },
                                ...buildings.map(building => ({
                                    value: building.id,
                                    label: building.name || `Здание ${building.id}`,
                                })),
                                { value: 'unassigned', label: 'Без заселения' },
                            ]}
                        />
                        <SelectField
                            label="Группа"
                            value={selectedGroupId}
                            onChange={(event) => onGroupChange(event.target.value === 'all' ? 'all' : Number(event.target.value))}
                            options={groupOptions}
                        />
                        <SelectField
                            label="Курс"
                            value={selectedCourse}
                            onChange={(event) => onCourseChange(event.target.value === 'all' ? 'all' : Number(event.target.value))}
                            options={courseOptions}
                        />
                        <SelectField
                            label="Пол"
                            value={selectedGender}
                            onChange={(event) => onGenderChange(event.target.value as 'male' | 'female' | 'all')}
                            options={genderOptions}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const StudentsListTab: React.FC<StudentsListTabProps> = ({
    students,
    buildings,
    selectedBuildingId,
    searchTerm,
    selectedGroupId,
    selectedCourse,
    selectedGender,
    onExportReady,
    onStudentClick,
}) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'fullName',
        direction: 'asc',
    });

    const buildingNameMap = useMemo(() => {
        const map = new Map<number, string>();
        buildings.forEach(building => {
            map.set(building.id, building.name || `Здание ${building.id}`);
        });
        return map;
    }, [buildings]);


    const getStudentBuildingName = (student: StudentsDto) => {
        if (!student.buildingId) {
            return '—';
        }
        return buildingNameMap.get(student.buildingId) ?? '—';
    };

    const formatResidenceInfo = (student: StudentsDto) => {
        if (!student.blockNumber) {
            return '—';
        }
        const capacity = student.roomCapacity ?? '—';
        return `${student.blockNumber} (${capacity})`;
    };

    const processedStudents = useMemo(() => {
        let result = [...students];

        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            result = result.filter(student =>
                `${student.surname || ''} ${student.name || ''} ${student.patronymic || ''}`.toLowerCase().includes(term) ||
                (student.blockNumber && student.blockNumber.toLowerCase().includes(term))
            );
        }

        if (selectedBuildingId === 'unassigned') {
            result = result.filter(student => !student.buildingId && !student.roomId);
        } else if (selectedBuildingId) {
            result = result.filter(student => student.buildingId === selectedBuildingId);
        }

        if (selectedGroupId !== 'all') {
            result = result.filter(student => student.group?.id === selectedGroupId);
        }
        if (selectedCourse !== 'all') {
            result = result.filter(student => student.group?.course === selectedCourse);
        }
        if (selectedGender !== 'all') {
            const genderBool = selectedGender === 'male';
            result = result.filter(student => student.gender === genderBool);
        }

        if (sortConfig) {
            const { key, direction } = sortConfig;
            const dirMultiplier = direction === 'asc' ? 1 : -1;
            result.sort((a, b) => {
                let aValue;
                let bValue;

                switch (key) {
                    case 'fullName':
                        aValue = `${a.surname || ''} ${a.name || ''} ${a.patronymic || ''}`.trim().toLowerCase();
                        bValue = `${b.surname || ''} ${b.name || ''} ${b.patronymic || ''}`.trim().toLowerCase();
                        break;
                    case 'group.course':
                        aValue = a.group?.course ?? 0;
                        bValue = b.group?.course ?? 0;
                        break;
                    case 'gender':
                        aValue = a.gender ? 1 : 0;
                        bValue = b.gender ? 1 : 0;
                        break;
                    case 'building':
                        aValue = getStudentBuildingName(a).toLowerCase();
                        bValue = getStudentBuildingName(b).toLowerCase();
                        break;
                    case 'birthday':
                        aValue = new Date(a.birthday).getTime();
                        bValue = new Date(b.birthday).getTime();
                        break;
                    case 'residence':
                        aValue = formatResidenceInfo(a).toLowerCase();
                        bValue = formatResidenceInfo(b).toLowerCase();
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) return -1 * dirMultiplier;
                if (aValue > bValue) return 1 * dirMultiplier;
                return 0;
            });
        }

        return result;
    }, [students, searchTerm, selectedBuildingId, selectedGroupId, selectedCourse, selectedGender, sortConfig]);

    const handleExportToExcel = useCallback(() => {
        const headerRow = [...IMPORT_EXPECTED_HEADERS];
        const bodyRows = processedStudents.map(student => ([
            `${student.surname || ''} ${student.name || ''} ${student.patronymic || ''}`.trim(),
            student.group?.name ?? '',
            student.group?.course ?? '',
            formatGenderShort(student.gender),
            student.origin ?? '',
            student.phone ?? '',
            formatBirthdayForExport(student.birthday),
            formatResidenceInfo(student),
        ]));

        const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Студенты');
        XLSX.writeFile(workbook, `Список_студентов_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }, [processedStudents]);

    useEffect(() => {
        onExportReady?.(() => handleExportToExcel);
        return () => {
            onExportReady?.(null);
        };
    }, [handleExportToExcel, onExportReady]);

    const requestSort = (key: string) => {
        setSortConfig(prevConfig => {
            if (prevConfig && prevConfig.key === key) {
                return {
                    key,
                    direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return { key, direction: 'asc' };
        });
    };

    const columns = [
        {
            key: 'fullName',
            title: 'ФИО',
            sortable: true,
            render: (student: StudentsDto) => `${student.surname || ''} ${student.name || ''} ${student.patronymic || ''}`.trim() || '—',
        },
        {
            key: 'group.name',
            title: 'Группа',
            render: (student: StudentsDto) => student.group?.name ?? '—',
        },
        {
            key: 'group.course',
            title: 'Курс',
            sortable: true,
            render: (student: StudentsDto) => student.group?.course ?? '—',
        },
        {
            key: 'gender',
            title: 'Пол',
            sortable: true,
            render: (student: StudentsDto) => student.gender ? 'М' : 'Ж',
        },
        {
            key: 'phone',
            title: 'Телефон',
            render: (student: StudentsDto) => student.phone ?? '—',
        },
        {
            key: 'birthday',
            title: 'День рождения',
            sortable: true,
            render: (student: StudentsDto) => formatBirthday(student.birthday),
        },
        {
            key: 'building',
            title: 'Здание',
            sortable: true,
            render: (student: StudentsDto) => getStudentBuildingName(student),
        },
        {
            key: 'residence',
            title: 'Блок',
            sortable: true,
            render: (student: StudentsDto) => formatResidenceInfo(student),
        },
    ];

    const rowAction = {
        icon: 'bi-arrows-angle-expand',
        title: 'Открыть карточку студента',
        onClick: (student: StudentsDto) => onStudentClick(student.id),
    };

    return (
        <div>
            <div className={styles.desktopTable}>
                <CommonTable
                    data={processedStudents}
                    totalCount={students.length}
                    columns={columns}
                    rowAction={rowAction}
                    onRowClick={(student) => onStudentClick(student.id)}
                    enableSorting={true}
                    onSortRequest={requestSort}
                    sortConfig={sortConfig}
                    emptyMessage="Студенты не найдены"
                />
            </div>

            <div className={styles.mobileCardsWrapper}>
                {processedStudents.length ? (
                    processedStudents.map(student => (
                        <button
                            type="button"
                            key={student.id}
                            className={styles.mobileCard}
                            onClick={() => onStudentClick(student.id)}
                        >
                            <p className={styles.mobileCardTitle}>
                                {`${student.surname || ''} ${student.name || ''} ${student.patronymic || ''}`.trim() || 'Нет'}
                            </p>
                            <div className={styles.mobileCardDivider}></div>
                            <div className={styles.mobileCardRow}>
                                <div className={styles.blockMetaColumn}>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Группа</span>
                                        <span className={styles.blockMetaValue}>{student.group?.name || 'Нет'}</span>
                                    </div>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Телефон</span>
                                        <span className={styles.blockMetaValue}>{student.phone || 'Нет'}</span>
                                    </div>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Рожден</span>
                                        <span className={styles.blockMetaValue}>{formatBirthday(student.birthday)}</span>
                                    </div>
                                </div>
                                <div className={styles.blockMetaColumn}>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Курс</span>
                                        <span className={styles.blockMetaValue}>{student.group?.course ?? 'Нет'}</span>
                                    </div>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Пол</span>
                                        <span className={styles.blockMetaValue}>{getGenderLabel(student.gender)}</span>
                                    </div>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Здание</span>
                                        <span className={styles.blockMetaValue}>{getStudentBuildingName(student)}</span>
                                    </div>
                                    <div className={styles.blockMeta}>
                                        <span className={styles.blockMetaLabel}>Проживание</span>
                                        <span className={styles.blockMetaValue}>{formatResidenceInfo(student)}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className={styles.mobileCardsEmpty}>Студенты не найдены</div>
                )}
            </div>
        </div>
    );
};

export default StudentsListTab;
