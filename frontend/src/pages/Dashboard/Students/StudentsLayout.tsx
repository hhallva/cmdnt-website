import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

import { apiClient } from '../../../api/client';

import type { StudentsDto, PostStudentDto, ContactDto } from '../../../types/students';
import type { GroupDto } from '../../../types/groups';
import type { UserSession } from '../../../types/UserSession';

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

    const userSessionStr = typeof window !== 'undefined' ? sessionStorage.getItem('userSession') : null;
    const userSession: UserSession | null = userSessionStr ? JSON.parse(userSessionStr) : null;
    const isEducator = userSession?.role?.name?.toLowerCase().includes('воспитатель');

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
                <ActionButton
                    variant='info'
                    size='md'
                    className={`${styles.actionBtn} ${styles.actionBtnMore}`}
                    onClick={() => navigate(`/dashboard/students/${student.id}`)}
                >
                    Подробнее
                </ActionButton>
            ),
        },
    ];
    // #endregion

    const handleExportToExcel = () => {
        // Подготовим данные для экспорта из processedStudents
        const dataForExport = processedStudents.map(student => ({
            'ФИО': `${student.surname || ''} ${student.name || ''} ${student.patronymic || ''}`.trim() || 'Нет',
            'Группа': student.group?.name || 'Нет',
            'Курс': student.group?.course || 'Нет',
            'Пол': student.gender ? 'Мужчина' : 'Женщина',
            'Блок': student.blockNumber || 'Нет',
            'Телефон': student.phone || 'Нет',
            'День рождения': new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(student.birthday)),
        }));

        // Создаём книгу Excel
        const wb = XLSX.utils.book_new();
        // Создаём лист из данных
        const ws = XLSX.utils.json_to_sheet(dataForExport);
        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(wb, ws, "Студенты");

        // Генерируем и скачиваем файл
        XLSX.writeFile(wb, `Список_студентов_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const listTabContent = (
        <>
            <div className="d-flex justify-content-between align-items-start mb-3"> {/* align-items-start для выравнивания по верхнему краю, если фильтры раскроются */}
                <div className="d-flex gap-2 flex-wrap"> {/* Контейнер для левой группы элементов */}
                    <div style={{ minWidth: '350px' }}> {/* Ограничиваем ширину поля поиска, чтобы оно не сжималось слишком сильно */}
                        <InputField
                            label=""
                            type="text"
                            placeholder="Поиск по ФИО или Блоку..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <ActionButton
                        variant='secondary'
                        onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                        aria-expanded={isAdvancedFilterOpen}
                        aria-controls="advancedFilters"
                    >
                        Расширенные фильтры
                        <i className={`bi ${isAdvancedFilterOpen ? 'bi-chevron-up' : 'bi-chevron-down'} ms-2`}></i>
                    </ActionButton>
                    <ActionButton
                        variant='secondary'
                        onClick={resetFiltersAndSorts}
                    >
                        Сбросить
                    </ActionButton>
                </div>
                {/* Правая часть - кнопка экспорта */}
                <div>
                    {!isEducator && (
                        <ActionButton
                            variant='success'
                            onClick={handleExportToExcel}
                        >
                            <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                            Экспорт в Excel
                        </ActionButton>
                    )}
                </div>
            </div>

            {/* Расширенные фильтры - теперь вне основного контейнера, но под ним */}
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
        origin: null,
    });

    const [newContacts, setNewContacts] = useState<{ comment: string; phone: string }[]>([]);

    const [formErrors, setFormErrors] = useState<{
        surname?: string;
        name?: string;
        patronymic?: string;
        birthday?: string;
        gender?: string;
        origin?: string;
        groupId?: string;
        phone?: string;
        contacts?: { comment?: string; phone?: string }[];
    }>({});

    const [isAdding, setIsAdding] = useState(false);


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

        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof typeof formErrors];
                return newErrors;
            });
        }
    };

    const handleAddContactField = () => {
        if (newContacts.length >= 5) {
            alert('Максимальное количество дополнительных контактов: 5.');
            return;
        }
        setNewContacts(prev => [...prev, { comment: '', phone: '' }]);
    };

    const handleRemoveContactField = (index: number) => {
        setNewContacts(prev => prev.filter((_, i) => i !== index));
        setFormErrors(prev => {
            if (prev.contacts) {
                const newContactErrors = [...prev.contacts];
                newContactErrors.splice(index, 1);
                return { ...prev, contacts: newContactErrors };
            }
            return prev;
        });
    };

    const handleContactChange = (index: number, field: 'comment' | 'phone', value: string) => {
        setNewContacts(prev => {
            const newContacts = [...prev];
            newContacts[index] = { ...newContacts[index], [field]: value };
            return newContacts;
        });

        setFormErrors(prev => {
            if (prev.contacts && prev.contacts[index]) {
                const newContactErrors = [...prev.contacts];
                newContactErrors[index] = { ...newContactErrors[index], [field]: undefined };
                return { ...prev, contacts: newContactErrors };
            }
            return prev;
        });
    };

    const validateForm = (): boolean => {
        const errors: typeof formErrors = {}; // Используем тот же тип
        let isValid = true;

        // --- Валидация основной формы ---
        if (!newStudent.surname?.trim()) {
            errors.surname = 'Фамилия обязательна.';
            isValid = false;
        } else if (newStudent.surname.length > 100) {
            errors.surname = 'Фамилия должна содержать не более 100 символов.';
            isValid = false;
        }

        if (!newStudent.name?.trim()) {
            errors.name = 'Имя обязательно.';
            isValid = false;
        } else if (newStudent.name.length > 100) {
            errors.name = 'Имя должно содержать не более 100 символов.';
            isValid = false;
        }

        if (newStudent.patronymic && newStudent.patronymic.length > 100) {
            errors.patronymic = 'Отчество должно содержать не более 100 символов.';
            isValid = false;
        }

        if (!newStudent.birthday) {
            errors.birthday = 'Дата рождения обязательна.';
            isValid = false;
        } else {
            const birthDate = new Date(newStudent.birthday);
            const today = new Date();
            if (isNaN(birthDate.getTime())) {
                errors.birthday = 'Некорректная дата рождения.';
                isValid = false;
            } else if (birthDate > today) {
                errors.birthday = 'Дата рождения не может быть в будущем.';
                isValid = false;
            }
        }

        if (newStudent.gender === null || newStudent.gender === undefined) {
            errors.gender = 'Пол обязателен для выбора.';
            isValid = false;
        }

        if (newStudent.origin && newStudent.origin.length > 300) {
            errors.origin = 'Поле "Откуда приехал" должно содержать не более 300 символов.';
            isValid = false;
        }
        if (newStudent.origin && newStudent.origin.length == 0) {
            newStudent.origin = null
        }

        if (!newStudent.groupId || newStudent.groupId <= 0) {
            errors.groupId = 'Пожалуйста, выберите группу.';
            isValid = false;
        }

        if (!newStudent.phone?.trim()) {
            errors.phone = 'Телефон обязателен.';
            isValid = false;
        } else {
            const phoneRegex = /^8\d{10}$/;
            if (!phoneRegex.test(newStudent.phone)) {
                errors.phone = 'Телефон должен быть в формате 89000000000.';
                isValid = false;
            }
        }

        // --- Валидация контактов ---
        const contactErrorsArray: { comment?: string; phone?: string }[] = [];
        let contactsValid = true;

        newContacts.forEach((contact, index) => {
            const contactErrors: { comment?: string; phone?: string } = {};

            if (!contact.comment.trim()) {
                contactErrors.comment = 'Комментарий обязателен.';
                contactsValid = false;
            }

            if (!contact.phone.trim()) {
                contactErrors.phone = 'Телефон обязателен.';
                contactsValid = false;
            } else {
                const phoneRegex = /^8\d{10}$/;
                if (!phoneRegex.test(contact.phone)) {
                    contactErrors.phone = 'Неверный формат телефона (8XXXXXXXXXX).';
                    contactsValid = false;
                }
            }

            contactErrorsArray[index] = contactErrors;
        });

        if (!contactsValid) {
            errors.contacts = contactErrorsArray;
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
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
            origin: null,
        });
        setNewContacts([])
        setFormErrors({});
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;


        setIsAdding(true);
        try {
            const studentDataToSend: PostStudentDto = {
                ...newStudent,
                groupId: newStudent.groupId && newStudent.groupId !== 0 ? newStudent.groupId : null,
            };

            console.log('Отправка данных нового студента:', studentDataToSend);
            const createdStudent = await apiClient.createStudent(studentDataToSend);
            console.log('Новый студент успешно добавлен:', createdStudent);

            if (newContacts.length > 0) {
                try {
                    const contactsToSend: Omit<ContactDto, 'id'>[] = newContacts.map(c => ({
                        comment: c.comment.trim(),
                        phone: c.phone.trim(),
                    }));

                    console.log('Отправка дополнительных контактов:', contactsToSend);
                    const addedContacts = await apiClient.addStudentContacts(createdStudent.id, contactsToSend);
                    console.log('Контакты успешно добавлены:', addedContacts);

                } catch (contactErr: any) {
                    console.error('Ошибка при добавлении контактов:', contactErr);
                    alert(`Студент "${createdStudent.surname}" успешно добавлен, но произошла ошибка при добавлении контактов: ${contactErr.message || 'Неизвестная ошибка'}`);
                }
            }

            resetAddForm();

            await fetchStudents();

        } catch (err: any) {
            console.error('Ошибка при добавлении студента:', err);
            const errorMessage = err.message || 'Ошибка при добавлении студента';
            setFormErrors(prev => ({ ...prev, form: errorMessage }));
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
                            error={formErrors.surname}
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
                            error={formErrors.name}
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
                            error={formErrors.patronymic}
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
                            error={formErrors.birthday}
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
                            error={formErrors.gender}
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
                            error={formErrors.origin}
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
                            error={formErrors.groupId}
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
                            error={formErrors.phone}
                        />
                    </div>
                    <div className="additional-contacts-section mt-4 pt-2">
                        <h4 className="h6 mb-2 pb-2 border-bottom">Дополнительные контакты</h4>

                        {newContacts.length > 0 && (
                            <div className="contact-fields-container">
                                {newContacts.map((contact, index) => (
                                    <div key={index} className="row g-2 mb-2 contact-field-row">
                                        <div className="col-md-5">
                                            <InputField
                                                label="Комментарий"
                                                type="text"
                                                value={contact.comment}
                                                onChange={(e) => handleContactChange(index, 'comment', e.target.value)}
                                                disabled={isAdding}
                                                error={formErrors.contacts?.[index]?.comment}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <InputField
                                                label="Телефон"
                                                type="tel"
                                                value={contact.phone}
                                                onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                                disabled={isAdding}
                                                error={formErrors.contacts?.[index]?.phone}
                                            />
                                        </div>
                                        <div className="col-md-1 d-flex align-items-end">
                                            <ActionButton
                                                type="button"
                                                variant='danger'
                                                onClick={() => handleRemoveContactField(index)}
                                                disabled={isAdding}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </ActionButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {newContacts.length < 5 && (
                            <ActionButton
                                type="button"
                                size='md'
                                onClick={handleAddContactField}>
                                <i className="bi bi-plus-circle me-1"></i>
                                Добавить контакт
                            </ActionButton>
                        )}
                    </div>


                </div>
                <div className="d-flex justify-content-end mt-4 pt-2">
                    <ActionButton
                        variant='secondary'
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

    const tabs = useMemo(() => {
        const baseTabs = [
            {
                id: 'list',
                title: 'Список студентов',
                content: listTabContent,
            },
        ];

        if (!isEducator) {
            baseTabs.push({
                id: 'add',
                title: 'Добавить студента',
                content: addTabContent,
            });
        }

        return baseTabs;
    }, [addTabContent, isEducator, listTabContent]);

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    if (error) return <div className="alert alert-danger m-3" role="alert">{error}</div>;

    return (
        <>
            <Tabs tabs={tabs} defaultActiveTabId="list" />
        </>
    );
};

export default StudentsLayout;