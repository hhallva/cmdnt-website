import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import type { StudentsDto } from '../../../../types/students';
import type { GroupDto } from '../../../../types/groups';

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
    isEducator: boolean;
    onStudentClick: (studentId: number) => void;
}

const StudentsListTab: React.FC<StudentsListTabProps> = ({ students, groups, isEducator, onStudentClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'all'>('all');
    const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');
    const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'all'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'fullName',
        direction: 'asc',
    });

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

    const processedStudents = useMemo(() => {
        let result = [...students];

        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            result = result.filter(student =>
                `${student.surname || ''} ${student.name || ''} ${student.patronymic || ''}`.toLowerCase().includes(term) ||
                (student.blockNumber && student.blockNumber.toLowerCase().includes(term))
            );
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
                    case 'blockNumber':
                        aValue = a.blockNumber?.toLowerCase() ?? '';
                        bValue = b.blockNumber?.toLowerCase() ?? '';
                        break;
                    case 'birthday':
                        aValue = new Date(a.birthday).getTime();
                        bValue = new Date(b.birthday).getTime();
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
    }, [students, searchTerm, selectedGroupId, selectedCourse, selectedGender, sortConfig]);

    const handleExportToExcel = () => {
        const headerRow = [...IMPORT_EXPECTED_HEADERS];
        const bodyRows = processedStudents.map(student => ([
            `${student.surname || ''} ${student.name || ''} ${student.patronymic || ''}`.trim(),
            student.group?.name ?? '',
            student.group?.course ?? '',
            formatGenderShort(student.gender),
            student.origin ?? '',
            student.phone ?? '',
            formatBirthdayForExport(student.birthday),
        ]));

        const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Студенты');
        XLSX.writeFile(workbook, `Список_студентов_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const resetFiltersAndSorts = () => {
        setSearchTerm('');
        setSelectedGroupId('all');
        setSelectedCourse('all');
        setSelectedGender('all');
        setSortConfig({ key: 'fullName', direction: 'asc' });
    };

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
            key: 'blockNumber',
            title: 'Блок',
            sortable: true,
            render: (student: StudentsDto) => student.blockNumber ?? '—',
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
    ];

    const rowAction = {
        icon: 'bi-arrows-angle-expand',
        title: 'Открыть карточку студента',
        onClick: (student: StudentsDto) => onStudentClick(student.id),
    };

    return (
        <div>
            <div className={`${styles.searchPanel} mb-3`}>
                <div className="justify-content-between align-items-start flex-wrap gap-3 gap-md-0">
                    <div className={`d-flex gap-2 flex-wrap ${styles.searchControls}`}>
                        <div className={styles.searchInputWrapper}>
                            <InputField
                                label=""
                                type="text"
                                placeholder="Поиск по ФИО или Блоку..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <ActionButton
                            variant="secondary"
                            size="md"
                            onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                            className={styles.modilButton}
                            aria-expanded={isAdvancedFilterOpen}
                        >
                            Фильтры
                            <i className={`bi ${isAdvancedFilterOpen ? 'bi-chevron-up' : 'bi-chevron-down'} ms-2`}></i>
                        </ActionButton>
                        <ActionButton
                            variant="secondary"
                            size="md"
                            onClick={resetFiltersAndSorts}
                            className={styles.modilButton}
                        >
                            Сбросить
                        </ActionButton>
                    </div>
                </div>

                {isAdvancedFilterOpen && (
                    <div id="advancedFilters" className={`collapse show ${styles.advancedFiltersPanel}`}>
                        <div className={styles.filtersGrid}>
                            <SelectField
                                label="Группа"
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                options={groupOptions}
                            />
                            <SelectField
                                label="Курс"
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                options={courseOptions}
                            />
                            <SelectField
                                label="Пол"
                                value={selectedGender}
                                onChange={(e) => setSelectedGender(e.target.value as 'male' | 'female' | 'all')}
                                options={genderOptions}
                            />
                        </div>
                    </div>
                )}
            </div>

            {!isEducator && (
                <div className={styles.tableContainer}>
                    <ActionButton
                        size="md"
                        variant="primary"
                        onClick={handleExportToExcel}
                        className={styles.fullWidthMobileButton}
                    >
                        <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                        Скачать в Excel
                    </ActionButton>
                </div>
            )}

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
                                        <span className={styles.blockMetaLabel}>Блок</span>
                                        <span className={styles.blockMetaValue}>{student.blockNumber || 'Нет'}</span>
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
