import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../../api/client';

import type { StudentsDto, PostStudentsDto } from '../../../types/students';
import type { GroupDto } from '../../../types/groups';

import Tabs from '../../../components/Tabs/Tabs';
import CommonTable from '../../../components/CommonTable/CommonTable'
import InputField from '../../../components/InputField/InputField';
import SelectField from '../../../components/SelectField/SelectField';
import ActionButton from '../../../components/ActionButton/ActionButton'
import CancelButton from '../../../components/CancelButton/CancelButton';

import styles from './Students.module.css';

const StudentsLayout: React.FC = () => {
    // #region Загрузка данных
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [students, setStudents] = useState<StudentsDto[]>([]);
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsResponse, groupsResponse] = await Promise.all([
                    apiClient.getAllStudents(),
                    apiClient.getAllGroups()
                ]);

                setStudents(studentsResponse);
                setGroups(groupsResponse);
                console.info("Получение студентов");
            } catch (err: any) {
                console.error('Ошибка при загрузке данных:', err);

                setError(err.message || 'Ошибка при загрузке данных');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);
    // #endregion

    // #region Поиск, фильтрация, сортировка
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

    // --- Фильтры ---
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'all'>('all');
    const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');
    const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'all'>('all');

    // --- Сортировки ---
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'fullName',
        direction: 'asc',
    });

    // --- Обработчики ---
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

    // --- Логика фильтрации и сортировки ---
    const processedStudents = useMemo(() => {
        let result = [...students];

        // 1. Поиск
        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            result = result.filter(student =>
                `${student.surname || ''} ${student.name || ''} ${student.patronymic || ''}`.toLowerCase().includes(term) ||
                (student.blockNumber && student.blockNumber.toLowerCase().includes(term))
            );
        }

        // 2. Расширенные фильтры
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

        // 3. Сортировка
        // Определяем активное поле сортировки (первое не null)
        if (sortConfig) {
            const { key, direction } = sortConfig;
            const dirMultiplier = direction === 'asc' ? 1 : -1;
            result.sort((a, b) => {
                let aValue, bValue;

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

    // --- Функции для управления сортировкой ---
    const requestSort = (key: string) => {
        setSortConfig(prevConfig => {
            // Если кликнули по тому же полю, меняем направление
            if (prevConfig && prevConfig.key === key) {
                return {
                    key,
                    direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
                };
            } else {
                // Если кликнули по новому полю, устанавливаем asc
                return { key, direction: 'asc' };
            }
        });
    };
    // Получаем уникальные курсы из групп для фильтра
    const uniqueCourses = useMemo(() => {
        const courses = new Set<number>();
        groups.forEach(group => {
            if (group.course) courses.add(group.course);
        });
        return Array.from(courses).sort((a, b) => a - b);
    }, [groups]);

    // Подготавливаем опции для SelectField
    const groupOptions = useMemo(() => [
        { value: 'all', label: 'Все группы' },
        ...groups.map(group => ({ value: group.id, label: group.name }))
    ], [groups]);

    const courseOptions = useMemo(() => [
        { value: 'all', label: 'Все курсы' },
        ...uniqueCourses.map(course => ({ value: course, label: `${course} курс` }))
    ], [uniqueCourses]);

    const genderOptions = [
        { value: 'all', label: 'Любой пол' },
        { value: 'male', label: 'Мужской' },
        { value: 'female', label: 'Женский' },
    ];
    // #endregion

    // #region Таблица
    const studentColumns = [
        {
            key: 'fullName',
            title: 'ФИО',
            sortable: true,
            render: (student: StudentsDto) => `${student.surname || ''} ${student.name || ''} ${student.patronymic || ''}`.trim() || 'Нет',
        },
        {
            key: 'group.name',
            title: 'Группа',
        },
        {
            key: 'group.course',
            title: 'Курс',
            sortable: true,
        },
        {
            key: 'gender',
            title: 'Пол',
            sortable: true,
            render: (student: StudentsDto) => student.gender ? "М" : "Ж",
        },
        {
            key: 'blockNumber',
            title: 'Блок',
            sortable: true,
            render: (student: StudentsDto) => student.blockNumber ?? "Нет",
        },
        {
            key: 'phone',
            title: 'Телефон',
            render: (student: StudentsDto) => student.phone ?? "Нет",
        },
        {
            key: 'birthday',
            title: 'День рождения',
            sortable: true,
            render: (student: StudentsDto) =>
                new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(student.birthday)),
        },
    ];

    const studentActions = [
        {
            render: (student: StudentsDto) => (
                <button
                    className={`${styles.actionBtn} ${styles.actionBtnMore}`}
                    onClick={() => alert(`Подробная информация о студенте:\n${student.surname} ${student.name} ${student.patronymic}\nID: ${student.id}`)}
                >
                    Подробнее
                </button>
            ),
        },
    ];

    // #endregion


    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    if (error) return <div className="alert alert-danger m-3" role="alert">{error}</div>;

    //#region Список студентов
    const listTabContent = (
        <>
            <div className={styles.searchAndFilterSection}>
                <div className="row g-2 mb-2 align-items-end">
                    <div className="col-md-6">
                        <InputField
                            label="Поиск"
                            type="text"
                            placeholder="Введите ФИО или номер блока..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="col-md-6 d-flex gap-2">
                        <ActionButton
                            variant='secondary'
                            onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                            aria-expanded={isAdvancedFilterOpen}
                            aria-controls="advancedFilters"
                        >
                            <i className={`bi ${isAdvancedFilterOpen ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                            {isAdvancedFilterOpen ? 'Скрыть фильтры' : 'Расширенные фильтры'}
                        </ActionButton>
                        <CancelButton onClick={resetFiltersAndSorts} />
                    </div>
                </div>

                {isAdvancedFilterOpen && (
                    <div id="advancedFilters" className={`collapse show ${styles.advancedFiltersPanel}`}>
                        <div className="row g-3 mb-3">
                            <div className="col-md-3">
                                <SelectField
                                    label="Группа"
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                    options={groupOptions}
                                />
                            </div>
                            <div className="col-md-3">
                                <SelectField
                                    label="Курс"
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                    options={courseOptions}
                                />
                            </div>
                            <div className="col-md-3">
                                <SelectField
                                    label="Пол"
                                    value={selectedGender}
                                    onChange={(e) => setSelectedGender(e.target.value as 'male' | 'female' | 'all')}
                                    options={genderOptions}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CommonTable
                title="Список студентов"
                data={processedStudents}
                totalCount={students.length}
                columns={studentColumns}
                actions={studentActions}
                enableSorting={true}
                onSortRequest={requestSort}
                sortConfig={sortConfig}
                emptyMessage="Студенты не найдены"
            />
        </>
    );
    //#endregion

    //#region Добавление студента





    const resetStudentForm = () => {

    };

    const handleAddStudentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Здесь будет логика добавления студента через API

        alert('Новый студент добавлен (заглушка)!');
        resetStudentForm()
    };

    const formOfEducationOptions = [
        { value: '', label: 'Выберите форму обучения' },
        { value: 'очная', label: 'Очная' },
        { value: 'заочная', label: 'Заочная' },
    ];

    const budgetOrContractOptions = [
        { value: '', label: 'Выберите тип финансирования' },
        { value: 'бюджет', label: 'Бюджет' },
        { value: 'контракт', label: 'Контракт' },
    ];

    const courseAddOptions = [
        { value: '', label: 'Выберите курс' },
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
    ];

    const genderAddOptions = [
        { value: '', label: 'Выберите пол' },
        { value: 'мужской', label: 'Мужской' },
        { value: 'женский', label: 'Женский' },
    ];

    const addTabContent = (
        <>
            <h3>Добавить нового студента</h3>
            <div className="p-3">
                <form onSubmit={handleAddStudentSubmit}>
                    <div className="row g-3">
                        {/* --- Блок 1: Информация о студенте --- */}
                        <div className="col-12">
                            <h4 className="h6 mb-3 pb-2 border-bottom">Информация о студенте</h4>
                        </div>
                        <div className="col-md-4">
                            <InputField
                                label="Фамилия"
                                type="text"
                                name="surname"
                                value={''}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <InputField
                                label="Имя"
                                type="text"
                                name="name"
                                value={''}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <InputField
                                label="Отчество"
                                type="text"
                                name="patronymic"
                                value={''}
                            />
                        </div>
                        <div className="col-md-4">
                            <InputField
                                label="Дата рождения"
                                type="date"
                                name="birthday"
                                value={''}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <SelectField
                                label="Пол"
                                name="gender"
                                value={''}
                                options={genderAddOptions}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <InputField
                                label="Откуда приехал"
                                type="text"
                                name="fromWhere"
                                value={''}
                                required
                            />
                        </div>

                        <div className="col-12 mt-4 pt-2">
                            <h4 className="h6 mb-3 pb-2 border-bottom">Обучение</h4>
                        </div>
                        <div className="col-md-3">
                            <SelectField
                                label="Группа"
                                name="groupId"
                                value={''}
                                options={groupOptions}
                                required
                            />
                        </div>
                        <div className="col-md-3">
                            <SelectField
                                label="Курс"
                                name="course"
                                value={''}
                                options={courseAddOptions}
                                required
                            />
                        </div>

                        <div className="col-12 mt-4 pt-2">
                            <h4 className="h6 mb-3 pb-2 border-bottom">Контакты</h4>
                        </div>
                        <div className="col-md-4">
                            <InputField
                                label="Контактный телефон"
                                type="tel" // Используем tel для телефонов
                                name="phone"
                                value={''}
                            />
                        </div>
                    </div>

                    {/* Кнопки действия */}
                    <div className="d-flex justify-content-end mt-4 pt-2">
                        <CancelButton
                            onClick={() => {
                                if (window.confirm('Вы уверены, что хотите отменить добавление студента?')) {
                                    resetStudentForm()
                                }
                            }}
                        />
                        <ActionButton
                            variant='primary'
                            onClick={() => resetStudentForm()}
                            className="ms-2"
                        >
                            <i className="bi bi-save me-1"></i>
                            Сохранить студента
                        </ActionButton>


                    </div>
                </form>
            </div>
        </>
    );
    //#endregion


    const tabs = [
        {
            id: 'list',
            title: 'Список студентов',
            content: listTabContent,
        },
        {
            id: 'add',
            title: 'Добавить студента',
            content: addTabContent,
        },
    ];

    return (
        <>
            <Tabs tabs={tabs} defaultActiveTabId="list" />
        </>
    );
};

export default StudentsLayout;