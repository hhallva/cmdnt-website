import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

const STUDENTS_TAB_STORAGE_KEY = 'students-active-tab';
const STUDENTS_DEFAULT_TAB_ID = 'list';
const MAX_IMPORT_FILE_SIZE = 200 * 1024 * 1024;
const IMPORT_EXPECTED_HEADERS = [
    'ФИО',
    'Группа',
    'Курс',
    'Пол',
    'Населенный пункт',
    'Телефон',
    'Дата рождения',
];

const StudentsLayout: React.FC = () => {
    // #region Загрузка данных
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [students, setStudents] = useState<StudentsDto[]>([]);
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const navigate = useNavigate();

    const userSessionStr = typeof window !== 'undefined' ? sessionStorage.getItem('userSession') : null;
    const userSession: UserSession | null = userSessionStr ? JSON.parse(userSessionStr) : null;
    const isEducator = userSession?.role?.name?.toLowerCase()?.includes('воспитатель');
    const [activeTabId, setActiveTabId] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return STUDENTS_DEFAULT_TAB_ID;
        }
        return sessionStorage.getItem(STUDENTS_TAB_STORAGE_KEY) || STUDENTS_DEFAULT_TAB_ID;
    });

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

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        sessionStorage.setItem(STUDENTS_TAB_STORAGE_KEY, activeTabId);
    }, [activeTabId]);

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
            render: (student: StudentsDto) => student.gender ? "М" : "Ж",
        },
        {
            key: 'blockNumber',
            title: 'Блок',
            sortable: true,
            render: (student: StudentsDto) => student.blockNumber ?? "—",
        },
        {
            key: 'phone',
            title: 'Телефон',
            render: (student: StudentsDto) => student.phone ?? "—",
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
        onClick: (student: StudentsDto) => navigate(`/dashboard/students/${student.id}`),
    };

    const formatBirthday = (birthday?: string | null): string => {
        if (!birthday) {
            return '—';
        }
        const parsed = new Date(birthday);
        if (Number.isNaN(parsed.getTime())) {
            return '—';
        }
        return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed);
    };

    const getGenderLabel = (value: boolean | null | undefined) => {
        if (value === null || value === undefined) return 'Нет';
        return value ? 'М' : 'Ж';
    };
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

    const listTabHeader = (
        <>
            <div className=" justify-content-between align-items-start mb-3 flex-wrap gap-3 gap-md-0">
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
                        variant='secondary'
                        size='md'
                        onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                        aria-expanded={isAdvancedFilterOpen}
                        aria-controls="advancedFilters"
                        className={styles.modilButton}
                    >
                        Фильтры
                        <i className={`bi ${isAdvancedFilterOpen ? 'bi-chevron-up' : 'bi-chevron-down'} ms-2`}></i>
                    </ActionButton>
                    <ActionButton
                        variant='secondary'
                        size='md'
                        onClick={resetFiltersAndSorts}
                        className={styles.modilButton}
                    >
                        Сбросить
                    </ActionButton>
                </div>
            </div>
            {/* Расширенные фильтры - теперь вне основного контейнера, но под ним */}
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
        </>
    );

    const listTabContent = (
        <>
            {!isEducator && (
                <div className={styles.tableContainer}>
                    <ActionButton
                        size='md'
                        variant='primary'
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
                            onClick={() => navigate(`/dashboard/students/${student.id}`)}
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
    const [importDragActive, setImportDragActive] = useState(false);
    const [importFileName, setImportFileName] = useState<string>('');
    const [importRows, setImportRows] = useState<Array<{
        fullName: string;
        groupName: string;
        course: string;
        gender: string;
        origin: string;
        phone: string;
        birthday: string;
    }>>([]);
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);


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

    const handlePendingRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleAddContactField();
        }
    };

    const validateForm = (): boolean => {
        const errors: typeof formErrors = {}; // Используем тот же тип
        let isValid = true;

        // --- Валидация основной формы ---
        if (!newStudent.surname?.trim()) {
            errors.surname = 'Поле обязательно';
            isValid = false;
        } else if (newStudent.surname.length > 100) {
            errors.surname = 'Максимум 100 символов';
            isValid = false;
        }

        if (!newStudent.name?.trim()) {
            errors.name = 'Поле обязательно';
            isValid = false;
        } else if (newStudent.name.length > 100) {
            errors.name = 'Максимум 100 символов';
            isValid = false;
        }

        if (newStudent.patronymic && newStudent.patronymic.length > 100) {
            errors.patronymic = 'Максимум 100 символов';
            isValid = false;
        }

        if (!newStudent.birthday) {
            errors.birthday = 'Поле обязательно';
            isValid = false;
        } else {
            const birthDate = new Date(newStudent.birthday);
            const today = new Date();
            if (isNaN(birthDate.getTime())) {
                errors.birthday = 'Только формат дд.мм.гггг';
                isValid = false;
            } else if (birthDate > today) {
                errors.birthday = 'Не может быть в будущем';
                isValid = false;
            }
        }

        if (newStudent.gender === null || newStudent.gender === undefined) {
            errors.gender = 'Поле обязательно';
            isValid = false;
        }

        if (newStudent.origin && newStudent.origin.length > 300) {
            errors.origin = 'Максимум 300 символов';
            isValid = false;
        }
        if (newStudent.origin && newStudent.origin.length == 0) {
            newStudent.origin = null
        }

        if (!newStudent.groupId || newStudent.groupId <= 0) {
            errors.groupId = 'Поле обязательно';
            isValid = false;
        }

        if (!newStudent.phone?.trim()) {
            errors.phone = 'Поле обязательно';
            isValid = false;
        } else {
            const phoneRegex = /^8\d{10}$/;
            if (!phoneRegex.test(newStudent.phone)) {
                errors.phone = 'Разрешен формат 8XXXXXXXXXX';
                isValid = false;
            }
        }

        // --- Валидация контактов ---
        const contactErrorsArray: { comment?: string; phone?: string }[] = [];
        let contactsValid = true;

        newContacts.forEach((contact, index) => {
            const contactErrors: { comment?: string; phone?: string } = {};

            if (!contact.comment.trim()) {
                contactErrors.comment = 'Поле обязательно';
                contactsValid = false;
            }

            if (!contact.phone.trim()) {
                contactErrors.phone = 'Поле обязательно';
                contactsValid = false;
            } else {
                const phoneRegex = /^8\d{10}$/;
                if (!phoneRegex.test(contact.phone)) {
                    contactErrors.phone = 'Разрешен формат 8XXXXXXXXXX';
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

    const splitFullName = useCallback((fullName: string) => {
        const parts = fullName.trim().split(/\s+/).filter(Boolean);
        const surname = parts[0] ?? '';
        const name = parts[1] ?? '';
        const patronymic = parts.slice(2).join(' ');
        return { surname, name, patronymic };
    }, []);

    const mapGenderFromText = useCallback((value: string): boolean | null => {
        const normalized = value.trim().toLowerCase();
        if (!normalized) {
            return null;
        }
        if (normalized.startsWith('м')) {
            return true;
        }
        if (normalized.startsWith('ж')) {
            return false;
        }
        return null;
    }, []);

    const sanitizePhone = useCallback((value: string): string => {
        const digits = value.replace(/\D/g, '');
        if (!digits) {
            return '';
        }
        if (digits.length === 11 && digits.startsWith('8')) {
            return digits;
        }
        if (digits.length === 10) {
            return `8${digits}`;
        }
        return digits;
    }, []);

    const formatDateForApi = useCallback((rawValue: string): string | null => {
        const trimmed = rawValue?.toString().trim();
        if (!trimmed) {
            return null;
        }
        const numericValue = Number(trimmed);
        if (!Number.isNaN(numericValue) && numericValue > 20000) {
            const parsed = XLSX.SSF.parse_date_code(numericValue);
            if (parsed) {
                const month = `${parsed.m}`.padStart(2, '0');
                const day = `${parsed.d}`.padStart(2, '0');
                return `${parsed.y}-${month}-${day}`;
            }
        }
        const replaced = trimmed.replace(/[./]/g, '-');
        const date = new Date(replaced);
        if (!Number.isNaN(date.getTime())) {
            return date.toISOString().slice(0, 10);
        }
        const dotParts = trimmed.split('.');
        if (dotParts.length === 3) {
            const [day, month, yearRaw] = dotParts;
            const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
            const isoCandidate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            const parsedDate = new Date(isoCandidate);
            if (!Number.isNaN(parsedDate.getTime())) {
                return isoCandidate;
            }
        }
        return null;
    }, []);

    const handleImportCancel = useCallback(() => {
        setImportRows([]);
        setImportFileName('');
        setImportError(null);
        setImportResult(null);
        setImportDragActive(false);
        setIsImporting(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleImportFile = useCallback(async (file: File | null) => {
        if (!file) {
            return;
        }
        if (file.size > MAX_IMPORT_FILE_SIZE) {
            setImportError('Файл превышает максимальный размер 200 МБ');
            setImportRows([]);
            setImportFileName('');
            return;
        }
        try {
            setImportError(null);
            setImportResult(null);
            setImportRows([]);
            setImportFileName(file.name);
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
                throw new Error('Файл не содержит листов');
            }
            const worksheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
                header: 1,
                raw: false,
                blankrows: false,
            }).filter(row => Array.isArray(row) && row.some(cell => (cell ?? '').toString().trim() !== ''));
            if (!rawRows.length) {
                throw new Error('Файл не содержит данных');
            }
            const headerRow = rawRows[0].map(cell => cell?.toString().trim().toLowerCase() ?? '');
            const headerMap: Record<string, number> = {};
            const missingHeaders: string[] = [];
            IMPORT_EXPECTED_HEADERS.forEach(header => {
                const index = headerRow.indexOf(header.toLowerCase());
                if (index === -1) {
                    missingHeaders.push(header);
                } else {
                    headerMap[header] = index;
                }
            });
            if (missingHeaders.length) {
                throw new Error(`Отсутствуют столбцы: ${missingHeaders.join(', ')}`);
            }
            const parsedRows = rawRows.slice(1).map(row => {
                const getValue = (header: string) => {
                    const idx = headerMap[header];
                    return idx !== undefined ? (row[idx] ?? '').toString().trim() : '';
                };
                return {
                    fullName: getValue('ФИО'),
                    groupName: getValue('Группа'),
                    course: getValue('Курс'),
                    gender: getValue('Пол'),
                    origin: getValue('Населенный пункт'),
                    phone: getValue('Телефон'),
                    birthday: getValue('Дата рождения'),
                };
            }).filter(row => row.fullName);
            if (!parsedRows.length) {
                throw new Error('Не найдено строк с данными для импорта');
            }
            setImportRows(parsedRows);
        } catch (err: any) {
            console.error('Ошибка обработки файла импорта:', err);
            setImportRows([]);
            setImportFileName('');
            setImportError(err?.message || 'Не удалось обработать файл');
        }
    }, []);

    const handleImportSubmit = useCallback(async () => {
        if (!importRows.length) {
            setImportError('Сначала загрузите файл с данными');
            return;
        }
        setIsImporting(true);
        setImportError(null);
        setImportResult(null);
        let successCount = 0;
        let failedCount = 0;
        for (const row of importRows) {
            const { surname, name, patronymic } = splitFullName(row.fullName);
            if (!surname || !name) {
                failedCount++;
                continue;
            }
            const normalizedGroupName = row.groupName.trim().toLowerCase();
            const courseNumber = Number(row.course);
            const matchedGroup = groups.find(group => {
                if (!group.name) {
                    return false;
                }
                const nameMatch = group.name.trim().toLowerCase() === normalizedGroupName;
                if (!nameMatch) {
                    return false;
                }
                if (Number.isNaN(courseNumber) || !group.course) {
                    return true;
                }
                return group.course === courseNumber;
            });
            if (!matchedGroup) {
                failedCount++;
                continue;
            }
            const birthdayIso = formatDateForApi(row.birthday);
            const genderValue = mapGenderFromText(row.gender);
            if (!birthdayIso || genderValue === null) {
                failedCount++;
                continue;
            }
            const payload: PostStudentDto = {
                surname,
                name,
                patronymic: patronymic || '',
                birthday: birthdayIso,
                groupId: matchedGroup.id,
                gender: genderValue,
                origin: row.origin || null,
                phone: sanitizePhone(row.phone),
            };
            try {
                await apiClient.createStudent(payload);
                successCount++;
            } catch (err) {
                console.error('Ошибка при импорте студента:', err);
                failedCount++;
            }
        }
        await fetchStudents();
        setImportResult({ success: successCount, failed: failedCount });
        setIsImporting(false);
        setImportRows([]);
        setImportFileName('');
    }, [importRows, splitFullName, groups, formatDateForApi, mapGenderFromText, sanitizePhone]);

    const handleDownloadTemplate = useCallback(() => {
        const worksheet = XLSX.utils.aoa_to_sheet([
            IMPORT_EXPECTED_HEADERS,
            ['Иванов Иван Иванович', 'ИС-21', '3', 'М', 'г. Пермь', '8XXXXXXXXXX', '12.08.2002'],
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
        XLSX.writeFile(workbook, 'Шаблон_импорта_студентов.xlsx');
    }, []);

    const handleDropZoneClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleDropZoneDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setImportDragActive(true);
    }, []);

    const handleDropZoneDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setImportDragActive(false);
    }, []);

    const handleDropZoneDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setImportDragActive(false);
        const file = event.dataTransfer?.files?.[0];
        void handleImportFile(file ?? null);
    }, [handleImportFile]);

    const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        void handleImportFile(file);
        event.target.value = '';
    }, [handleImportFile]);

    const handleDropZoneKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleDropZoneClick();
        }
    }, [handleDropZoneClick]);

    const addTabContent = (
        <form onSubmit={handleAddSubmit}>
            <div className={styles.formSectionsWrapper}>
                <section className={styles.formSection}>
                    <h4 className={styles.formSectionTitle}>Основное</h4>
                    <div className="row g-3 mt-0">
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
                                            ''
                                }
                                onChange={handleAddChange}
                                options={genderAddOptions}
                                disabled={isAdding}
                                error={formErrors.gender}
                            />
                        </div>
                        <div className="col-md-4">
                            <InputField
                                label="Населенный пункт"
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
                    </div>
                </section>
                <section className={styles.formSection}>
                    <h4 className={styles.formSectionTitle}>Дополнительно</h4>
                    <div className={styles.contactsWrapper}>
                        {newContacts.length > 0 && (
                            <div className={styles.contactsList}>
                                {newContacts.map((contact, index) => (
                                    <div key={index} className={`${styles.contactRow} ${styles.addedContactRow}`}>
                                        <div className={styles.contactField}>
                                            <InputField
                                                label="Комментарий"
                                                type="text"
                                                value={contact.comment}
                                                onChange={(e) => handleContactChange(index, 'comment', e.target.value)}
                                                disabled={isAdding}
                                                error={formErrors.contacts?.[index]?.comment}
                                            />
                                        </div>
                                        <div className={styles.contactField}>
                                            <InputField
                                                label="Телефон"
                                                type="tel"
                                                value={contact.phone}
                                                onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                                disabled={isAdding}
                                                error={formErrors.contacts?.[index]?.phone}
                                            />
                                        </div>
                                        <div className={styles.contactButtonCell}>
                                            <ActionButton
                                                type="button"
                                                variant='secondary'
                                                size='md'
                                                className={styles.contactActionButton}
                                                onClick={() => handleRemoveContactField(index)}
                                                disabled={isAdding}
                                            >
                                                <span aria-hidden="true" className={styles.pendingPlusIconDelete}>-</span>
                                                <span className="visually-hidden">Удалить контакт</span>
                                            </ActionButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {newContacts.length < 5 && (
                            <div
                                role="button"
                                tabIndex={0}
                                className={`${styles.contactRow} ${styles.pendingContactRow}`}
                                onClick={handleAddContactField}
                                onKeyDown={handlePendingRowKeyDown}
                                aria-label="Добавить контакт"
                            >
                                <div className={styles.contactField}>
                                    <div className={styles.pendingFieldWrapper}>
                                        <InputField
                                            label="Комментарий"
                                            type="text"
                                            value=""
                                            placeholder=""
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className={styles.contactField}>
                                    <div className={styles.pendingFieldWrapper}>
                                        <InputField
                                            label="Телефон"
                                            type="text"
                                            value=""
                                            placeholder=""
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className={styles.contactButtonCell}>
                                    <span className={styles.pendingPlusIcon}>+</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
            <div className={styles.formSection + ' mt-4 d-flex justify-content-end'}>
                <ActionButton
                    size='md'
                    className={styles.fullWidthMobileButton}
                    variant='secondary'
                    onClick={resetAddForm}
                    disabled={isAdding}
                >
                    Сбросить
                </ActionButton>
                <ActionButton
                    size='md'
                    className={styles.fullWidthMobileButton + ' ms-2'}
                    type='submit'
                    variant='primary'
                    disabled={isAdding}
                >
                    Добавить
                </ActionButton>
            </div>
        </form >
    );
    //#endregion

    const importTabContent = (
        <div className={styles.importTabWrapper}>
            <section className={styles.importSection}>
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Загрузить файл импорта"
                    className={`${styles.importDropZone} ${importDragActive ? styles.importDropZoneActive : ''}`}
                    onClick={handleDropZoneClick}
                    onKeyDown={handleDropZoneKeyDown}
                    onDragOver={handleDropZoneDragOver}
                    onDragLeave={handleDropZoneDragLeave}
                    onDrop={handleDropZoneDrop}
                >
                    <i className={`bi bi-cloud-upload-fill ${styles.importDropIcon}`}></i>
                    <p className={styles.importDropTitle}>Импорт студентов</p>
                    <p className={styles.importDropHint}>
                        Перетащите файл или{' '}
                        <button
                            type="button"
                            className={styles.importChooseLink}
                            onClick={handleDropZoneClick}
                        >
                            Выберите
                        </button>
                    </p>
                    <p className={styles.importDropNote}>Формат: xls, xlsx, csv; Максимальный размер: 200 MB</p>
                    {importFileName && (
                        <p className={styles.importFileName}>Выбран файл: {importFileName}</p>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    className="visually-hidden"
                    onChange={handleFileInputChange}
                />
                {importError && (
                    <div className="alert alert-danger mt-3" role="alert">
                        {importError}
                    </div>
                )}
                {importResult && (
                    <div className="alert alert-success mt-3" role="alert">
                        Успешно: {importResult.success}. Ошибки: {importResult.failed}.
                    </div>
                )}
                <div className={styles.previewTableWrapper}>
                    {importRows.length ? (
                        <div className="table-responsive">
                            <table className={`table table-sm mb-0 ${styles.importPreviewTable}`}>
                                <thead>
                                    <tr>
                                        <th scope="col">№</th>
                                        <th scope="col">ФИО</th>
                                        <th scope="col">Группа</th>
                                        <th scope="col">Курс</th>
                                        <th scope="col">Пол</th>
                                        <th scope="col">Населенный пункт</th>
                                        <th scope="col">Телефон</th>
                                        <th scope="col">Дата рождения</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importRows.map((row, index) => (
                                        <tr key={`${row.fullName}-${index}`}>
                                            <td>{index + 1}</td>
                                            <td>{row.fullName}</td>
                                            <td>{row.groupName}</td>
                                            <td>{row.course}</td>
                                            <td>{row.gender}</td>
                                            <td>{row.origin}</td>
                                            <td>{row.phone}</td>
                                            <td>{row.birthday}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.previewPlaceholder}>
                            Таблица предварительного просмотра появится после выбора файла.
                        </div>
                    )}
                </div>
            </section>
            <section className={styles.importSection}>
                <div className={styles.importActions}>
                    <ActionButton
                        variant="transparent-primary"
                        size="md"
                        onClick={handleDownloadTemplate}
                        className={styles.importTemplateButton}
                    >
                        <i className="bi bi-download me-2"></i>
                        Скачать шаблон
                    </ActionButton>
                    <div className={styles.importActionsRight}>
                        <ActionButton
                            variant="secondary"
                            size="md"
                            onClick={handleImportCancel}
                            disabled={isImporting}
                        >
                            Отмена
                        </ActionButton>
                        <ActionButton
                            variant="primary"
                            size="md"
                            onClick={handleImportSubmit}
                            disabled={!importRows.length || isImporting}
                        >
                            <i className="bi bi-upload me-2"></i>
                            Загрузить
                        </ActionButton>
                    </div>
                </div>
            </section>
        </div>
    );

    const tabs = useMemo(() => {
        const baseTabs: Array<{ id: string; title: string; headerContent?: React.ReactNode; content: React.ReactNode }> = [
            {
                id: 'list',
                title: 'Список',
                headerContent: listTabHeader,
                content: listTabContent,
            },
        ];

        if (!isEducator) {
            baseTabs.push({
                id: 'add',
                title: 'Новый студент',
                content: addTabContent,
            });
            baseTabs.push({
                id: 'import',
                title: 'Импорт студентов',
                content: importTabContent,
            });
        }

        return baseTabs;
    }, [addTabContent, importTabContent, isEducator, listTabContent, listTabHeader]);

    useEffect(() => {
        if (tabs.some(tab => tab.id === activeTabId)) {
            return;
        }
        const fallbackTabId = tabs[0]?.id ?? STUDENTS_DEFAULT_TAB_ID;
        setActiveTabId(fallbackTabId);
    }, [tabs, activeTabId]);

    const handleTabChange = (tabId: string) => {
        if (tabs.some(tab => tab.id === tabId)) {
            setActiveTabId(tabId);
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    if (error) return <div className="alert alert-danger m-3" role="alert">{error}</div>;

    return (
        <>
            <Tabs
                tabs={tabs}
                activeTabId={activeTabId}
                onTabChange={handleTabChange}
            />
        </>
    );
};

export default StudentsLayout;