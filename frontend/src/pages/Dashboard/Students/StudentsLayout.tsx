import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../../api/client';

import type { StudentsDto, PostStudentDto } from '../../../types/students';
import type { GroupDto } from '../../../types/groups';

import Tabs from '../../../components/Tabs/Tabs';
import CommonTable from '../../../components/CommonTable/CommonTable'
import InputField from '../../../components/InputField/InputField';
import SelectField from '../../../components/SelectField/SelectField';
import ActionButton from '../../../components/ActionButton/ActionButton'

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

    const fetchStudents = async () => {
        try {
            const response = await apiClient.getAllStudents();
            setStudents(response);
        } catch (err: any) {
            console.error('Ошибка при загрузке студентов:', err);
            throw err;
        }
    };
    // #endregion

    //#region Список студентов

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
    const columns = [
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

    const actions = [
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

    const listTabContent = (
        <>
            <div className="row g-2 mb-3 align-items-end">
                <div className="col-md-6">
                    <InputField
                        label=""
                        type="text"
                        placeholder="Поиск по ФИО или Блоку..."
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
                    <ActionButton
                        variant='dark'
                        onClick={resetFiltersAndSorts}
                    >
                        Сбросить
                    </ActionButton>
                </div>

                {isAdvancedFilterOpen && (
                    <div id="advancedFilters" className={`collapse show ${styles.advancedFiltersPanel}`}>
                        <div className="row g-3">
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
                columns={columns}
                actions={actions}
                enableSorting={true}
                onSortRequest={requestSort}
                sortConfig={sortConfig}
                emptyMessage="Студенты не найдены"
            />
        </>
    );
    //#endregion

    //#region Добавление студента
    const [newStudent, setNewStudent] = useState<Omit<PostStudentDto, 'id'> & { id?: number }>({
        name: '',
        surname: '',
        patronymic: '',
        birthday: '',
        groupId: null,
        gender: null,
        phone: '',
        origin: '',
    });
    const [isAdding, setIsAdding] = useState(false);
    const [addErrors, setAddErrors] = useState<Record<string, string>>({});

    const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const val = value;

        setNewStudent(prev => {
            if (name === 'groupId') {
                const numValue = val === '' || val === 'null' ? null : Number(val);
                return { ...prev, [name]: numValue };
            }
            if (name === 'gender') {
                const boolOrNull = val === 'true' ? true : val === 'false' ? false : null;
                return { ...prev, [name]: boolOrNull };
            }
            return { ...prev, [name]: val };
        });

        if (addErrors[name]) {
            setAddErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const resetAddForm = () => {
        setNewStudent({
            name: '',
            surname: '',
            patronymic: '',
            birthday: '',
            groupId: null,
            gender: null,
            phone: '',
            origin: '',
        });
        setAddErrors({});
    };

    const validateAddStudentForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!newStudent.surname?.trim()) {
            errors.surname = 'Фамилия обязательна.';
        } else if (newStudent.surname.length > 100) {
            errors.surname = 'Фамилия должна содержать не более 100 символов.';
        }

        if (!newStudent.name?.trim()) {
            errors.name = 'Имя обязательно.';
        } else if (newStudent.name.length > 100) {
            errors.name = 'Имя должно содержать не более 100 символов.';
        }

        if (newStudent.patronymic && newStudent.patronymic.length > 100) {
            errors.patronymic = 'Отчество должно содержать не более 100 символов.';
        }

        if (!newStudent.birthday) {
            errors.birthday = 'Дата рождения обязательна.';
        } else {
            const birthDate = new Date(newStudent.birthday);
            const today = new Date();
            if (isNaN(birthDate.getTime())) {
                errors.birthday = 'Некорректная дата рождения.';
            } else if (birthDate > today) {
                errors.birthday = 'Дата рождения не может быть в будущем.';
            }
        }

        if (newStudent.gender === null || newStudent.gender === undefined) {
            errors.gender = 'Пол обязателен для выбора.';
        }

        if (newStudent.origin && newStudent.origin.length > 300) {
            errors.origin = 'Поле Откуда приехал должно содержать не более 300 символов.';
        }

        if (!newStudent.groupId || newStudent.groupId <= 0) {
            errors.groupId = 'Пожалуйста, выберите группу.';
        }

        if (!newStudent.phone?.trim()) {
            errors.phone = 'Номер телефона обязателен.';
        } else if (newStudent.phone) {
            const phoneRegex = /^8\d{10}$/;
            if (!phoneRegex.test(newStudent.phone)) {
                errors.phone = 'Телефон должен быть в формате 89000000000.';
            }
        }


        setAddErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAddStudentForm()) {
            return;
        }

        setIsAdding(true);
        try {
            const studentDataToSend: PostStudentDto = {
                ...newStudent,
                groupId: newStudent.groupId && newStudent.groupId !== 0 ? newStudent.groupId : null,
            };

            console.log('Отправка данных нового студента:', studentDataToSend);

            const createdStudent = await apiClient.createStudent(studentDataToSend);
            alert('Cтудент успешно добавлен!');
            console.log('Новый студент успешно добавлен:', createdStudent);

            resetAddForm();

            await fetchStudents();

        } catch (err: any) {
            console.error('Ошибка при добавлении студента:', err);
            const errorMessage = err.message || 'Ошибка при добавлении студента';
            setAddErrors(errorMessage);
        } finally {
            setIsAdding(false);
        }
    };

    const groupAddOptions = useMemo(() => [
        { value: 'all', label: 'Выберите группу' },
        ...groups.map(group => ({ value: group.id, label: group.name }))
    ], [groups]);

    const genderAddOptions = [
        { value: '', label: 'Выберите пол' },
        { value: 'true', label: 'Мужской' },
        { value: 'false', label: 'Женский' },
    ];

    const addTabContent = (
        <>
            <h3 className="mb-2">Добавить нового студента</h3>

            <form onSubmit={handleAddSubmit}>
                <div className="row g-3 mt-2">
                    <div className="col-md-4">
                        <InputField
                            label="Фамилия"
                            type="text"
                            name="surname"
                            value={newStudent.surname || ''}
                            onChange={handleAddChange}
                            error={addErrors.surname}
                            disabled={isAdding}
                        />
                    </div>
                    <div className="col-md-4">
                        <InputField
                            label="Имя"
                            type="text"
                            name="name"
                            value={newStudent.name || ''}
                            onChange={handleAddChange}
                            disabled={isAdding}
                            error={addErrors.name}
                        />
                    </div>
                    <div className="col-md-4">
                        <InputField
                            label="Отчество"
                            type="text"
                            name="patronymic"
                            value={newStudent.patronymic || ''}
                            onChange={handleAddChange}
                            disabled={isAdding}
                            error={addErrors.patronymic}
                        />
                    </div>
                    <div className="col-md-4">
                        <InputField
                            label="Дата рождения"
                            type="date"
                            name="birthday"
                            value={newStudent.birthday || ''}
                            onChange={handleAddChange}
                            disabled={isAdding}
                            error={addErrors.birthday}
                        />
                    </div>
                    <div className="col-md-4">
                        <SelectField
                            label="Пол"
                            name="gender"
                            value={
                                newStudent.gender === true ? 'true' :
                                    newStudent.gender === false ? 'false' :
                                        '' // Если null или undefined, value будет пустой строкой
                            }
                            onChange={handleAddChange}
                            options={genderAddOptions}
                            disabled={isAdding}
                            error={addErrors.gender}
                        />
                    </div>
                    <div className="col-md-4">
                        <InputField
                            label="Откуда приехал"
                            type="text"
                            name="origin"
                            value={newStudent.origin || ''}
                            onChange={handleAddChange}
                            disabled={isAdding}
                            error={addErrors.origin}
                        />
                    </div>
                    <div className="col-md-4">
                        <SelectField
                            label="Группа"
                            name="groupId"
                            value={newStudent.groupId ?? ''}
                            onChange={handleAddChange}
                            options={groupAddOptions}
                            disabled={isAdding}
                            error={addErrors.groupId}
                        />
                    </div>
                    <div className="col-md-4">
                        <InputField
                            label="Контактный телефон"
                            type="tel"
                            name="phone"
                            value={newStudent.phone || ''}
                            onChange={handleAddChange}
                            disabled={isAdding}
                            error={addErrors.phone}
                        />
                    </div>
                    <div className="col-12 mt-4 pt-2">
                        <h4 className="h6 mb-2 pb-2 border-bottom">Дополнительные контакты</h4>
                    </div>
                </div>
                <div className="d-flex justify-content-end mt-4 pt-2">
                    <ActionButton
                        variant='dark'
                        onClick={resetAddForm}
                        disabled={isAdding}
                    >
                        Сбросить
                    </ActionButton>
                    <ActionButton
                        type='submit'
                        variant='primary'
                        className="ms-2"
                    >
                        Добавить
                    </ActionButton>
                </div>
            </form>
        </>
    );
    //#endregion

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    if (error) return <div className="alert alert-danger m-3" role="alert">{error}</div>;

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