import React, { useState, useEffect, useMemo } from 'react';
import type { StudentsDto, ContactDto } from '../../../../../types/students';
import type { GroupDto } from '../../../../../types/groups';

import { apiClient } from '../../../../../api/client';

import InputField from '../../../../../components/InputField/InputField';
import SelectField from '../../../../../components/SelectField/SelectField';
import ActionButton from '../../../../../components/ActionButton/ActionButton';
import CommonModal from '../../../../../components/CommonModal/CommonModal';
import styles from './EditStudentModal.module.css';

interface EditStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: StudentsDto;
    contacts: ContactDto[];
    onSave: (updatedStudent: StudentsDto) => void;
}

interface FormErrors {
    surname?: string;
    name?: string;
    patronymic?: string;
    birthday?: string;
    gender?: string;
    origin?: string;
    groupId?: string;
    phone?: string;
    contacts?: { comment?: string; phone?: string }[];
    form?: string;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, onClose, student, contacts, onSave }) => {
    const [formData, setFormData] = useState<StudentsDto>(student);
    const [contactsList, setContacts] = useState<ContactDto[]>(contacts || []);
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    useEffect(() => {
        if (!isOpen) return;
        setFormData(student);
        setContacts(contacts || []);
        setFormErrors({});
        setError(null);
    }, [student, contacts, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const fetchGroups = async () => {
            setLoading(true);
            try {
                const groupsResponse = await apiClient.getAllGroups();
                setGroups(groupsResponse);
                console.info("Данные успешно загружены");
            } catch (err: any) {
                console.error('Ошибка при загрузке данных:', err);
                setError(err.message || 'Ошибка при загрузке данных');
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, [isOpen]);

    const genderOptions = [
        { value: '', label: 'Выберите пол' },
        { value: 'true', label: 'Мужской' },
        { value: 'false', label: 'Женский' },
    ];

    const groupOptions = useMemo(() => [
        { value: '', label: 'Выберите группу' },
        ...groups.map(group => ({ value: group.id, label: group.name }))
    ], [groups]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'groupId') {
                const numValue = value === '' || value === 'null' ? null : Number(value);
                if (numValue === null) {
                    const { group: _group, ...rest } = prev as StudentsDto & { group?: GroupDto };
                    return { ...rest } as StudentsDto;
                }
                const selectedGroup = groups.find(g => g.id === numValue);
                if (selectedGroup) {
                    return { ...prev, group: selectedGroup } as StudentsDto;
                }
                return prev;
            }
            if (name === 'gender') {
                const boolOrNull = value === 'true' ? true : value === 'false' ? false : null;
                return { ...prev, gender: boolOrNull };
            }
            if (name === 'origin') {
                const newValue = value.trim() === '' ? null : value;
                return { ...prev, origin: newValue };
            }
            return { ...prev, [name]: value };
        });

        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleContactChange = (index: number, field: 'comment' | 'phone', value: string) => {
        setContacts(prev => {
            const newContacts = [...prev];
            newContacts[index] = { ...newContacts[index], [field]: value };
            return newContacts;
        });

        setFormErrors(prev => {
            if (!prev.contacts) return prev;
            const nextContacts = [...prev.contacts];
            if (!nextContacts[index]) return prev;
            nextContacts[index] = { ...nextContacts[index], [field]: undefined };
            return { ...prev, contacts: nextContacts };
        });
    };

    const handleAddContactField = () => {
        if (contactsList.length >= 5) return;
        setContacts(prev => [...prev, { comment: '', phone: '' }]);
    };

    const handleRemoveContactField = (index: number) => {
        setContacts(prev => prev.filter((_, i) => i !== index));
        setFormErrors(prev => {
            if (!prev.contacts) return prev;
            const nextContacts = [...prev.contacts];
            nextContacts.splice(index, 1);
            return { ...prev, contacts: nextContacts };
        });
    };

    const handlePendingRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleAddContactField();
        }
    };

    const validateForm = () => {
        const errors: FormErrors = {};
        let isValid = true;

        if (!formData.surname?.trim()) {
            errors.surname = 'Фамилия обязательна.';
            isValid = false;
        } else if (formData.surname.length > 100) {
            errors.surname = 'Фамилия должна содержать не более 100 символов.';
            isValid = false;
        }

        if (!formData.name?.trim()) {
            errors.name = 'Имя обязательно.';
            isValid = false;
        } else if (formData.name.length > 100) {
            errors.name = 'Имя должно содержать не более 100 символов.';
            isValid = false;
        }

        if (formData.patronymic && formData.patronymic.length > 100) {
            errors.patronymic = 'Отчество должно содержать не более 100 символов.';
            isValid = false;
        }

        if (!formData.birthday) {
            errors.birthday = 'Дата рождения обязательна.';
            isValid = false;
        } else {
            const birthDate = new Date(formData.birthday);
            const today = new Date();
            if (isNaN(birthDate.getTime())) {
                errors.birthday = 'Некорректная дата рождения.';
                isValid = false;
            } else if (birthDate > today) {
                errors.birthday = 'Дата рождения не может быть в будущем.';
                isValid = false;
            }
        }

        if (formData.gender === null || formData.gender === undefined) {
            errors.gender = 'Пол обязателен для выбора.';
            isValid = false;
        }

        if (formData.origin && formData.origin.length > 300) {
            errors.origin = 'Поле "Откуда приехал" должно содержать не более 300 символов.';
            isValid = false;
        }

        if (!formData.group?.id || formData.group.id <= 0) {
            errors.groupId = 'Пожалуйста, выберите группу.';
            isValid = false;
        }

        if (!formData.phone?.trim()) {
            errors.phone = 'Телефон обязателен.';
            isValid = false;
        } else {
            const phoneRegex = /^8\d{10}$/;
            if (!phoneRegex.test(formData.phone)) {
                errors.phone = 'Телефон должен быть в формате 89000000000.';
                isValid = false;
            }
        }

        const contactErrorsArray: { comment?: string; phone?: string }[] = [];
        let contactsValid = true;

        contactsList.forEach((contact, index) => {
            const contactErrors: { comment?: string; phone?: string } = {};
            if (!contact.comment?.trim()) {
                contactErrors.comment = 'Комментарий обязателен.';
                contactsValid = false;
            }
            if (!contact.phone?.trim()) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student?.id) return;

        if (!validateForm()) return;

        setError(null);
        setLoading(true);
        try {
            const payload = {
                student: formData,
                contacts: contactsList,
            };

            const updatedStudent = await apiClient.updateStudent(student.id, payload);
            onSave({ ...updatedStudent, contacts: contactsList });
            onClose();
        } catch (err: any) {
            const msg = err.message || 'Не удалось сохранить изменения';
            setError(msg);
            setFormErrors(prev => ({ ...prev, form: msg }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            title="Редактировать данные студента"
            minWidth={900}
            minHeight={520}
        >
            <form className={styles.modalForm} onSubmit={handleSubmit}>
                {(error || formErrors.form) && (
                    <div className={`alert alert-danger ${styles.alertMessage}`}>
                        {formErrors.form || error}
                    </div>
                )}
                <div className={styles.formBody}>
                    <div className={styles.formSectionsWrapper}>
                        <section>
                            <div className="row g-3 mt-0">
                                <div className="col-md-4">
                                    <InputField
                                        label="Фамилия"
                                        type="text"
                                        name="surname"
                                        value={formData.surname || ''}
                                        onChange={handleChange}
                                        error={formErrors.surname}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <InputField
                                        label="Имя"
                                        type="text"
                                        name="name"
                                        value={formData.name || ''}
                                        onChange={handleChange}
                                        error={formErrors.name}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <InputField
                                        label="Отчество"
                                        type="text"
                                        name="patronymic"
                                        value={formData.patronymic || ''}
                                        onChange={handleChange}
                                        error={formErrors.patronymic}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <InputField
                                        label="Дата рождения"
                                        type="date"
                                        name="birthday"
                                        value={
                                            formData.birthday
                                                ? formData.birthday.includes('.')
                                                    ? formData.birthday.split('.').reverse().join('-')
                                                    : formData.birthday.slice(0, 10)
                                                : ''
                                        }
                                        onChange={handleChange}
                                        error={formErrors.birthday}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <SelectField
                                        label="Пол"
                                        name="gender"
                                        value={formData.gender === true ? 'true' : formData.gender === false ? 'false' : ''}
                                        onChange={handleChange}
                                        options={genderOptions}
                                        error={formErrors.gender}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <InputField
                                        label="Населенный пункт"
                                        type="text"
                                        name="origin"
                                        value={formData.origin || ''}
                                        onChange={handleChange}
                                        error={formErrors.origin}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <SelectField
                                        label="Группа"
                                        name="groupId"
                                        value={formData.group?.id ?? ''}
                                        onChange={handleChange}
                                        options={groupOptions}
                                        error={formErrors.groupId}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <InputField
                                        label="Контактный телефон"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleChange}
                                        error={formErrors.phone}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </section>
                        <section>
                            <div className={styles.contactsWrapper}>
                                {contactsList.length > 0 && (
                                    <div className={styles.contactsList}>
                                        {contactsList.map((contact, index) => (
                                            <div key={index} className={`${styles.contactRow} ${styles.addedContactRow}`}>
                                                <div className={styles.contactField}>
                                                    <InputField
                                                        label="Комментарий"
                                                        type="text"
                                                        value={contact.comment}
                                                        onChange={e => handleContactChange(index, 'comment', e.target.value)}
                                                        error={formErrors.contacts?.[index]?.comment}
                                                        disabled={loading}
                                                    />
                                                </div>
                                                <div className={styles.contactField}>
                                                    <InputField
                                                        label="Телефон"
                                                        type="tel"
                                                        value={contact.phone}
                                                        onChange={e => handleContactChange(index, 'phone', e.target.value)}
                                                        error={formErrors.contacts?.[index]?.phone}
                                                        disabled={loading}
                                                    />
                                                </div>
                                                <div className={styles.contactButtonCell}>
                                                    <ActionButton
                                                        type="button"
                                                        variant='secondary'
                                                        size='md'
                                                        className={styles.contactActionButton}
                                                        onClick={() => handleRemoveContactField(index)}
                                                        disabled={loading}
                                                    >
                                                        <span aria-hidden="true" className={styles.pendingPlusIconDelete}>-</span>
                                                        <span className="visually-hidden">Удалить контакт</span>
                                                    </ActionButton>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {contactsList.length < 5 && (
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
                </div>
                <div className={styles.formFooter}>
                    <ActionButton
                        size='md'
                        className={`${styles.footerButton} ${styles.fullWidthMobileButton}`}
                        variant='secondary'
                        onClick={() => {
                            setFormData(student);
                            setContacts(contacts || []);
                            setFormErrors({});
                            setError(null);
                        }}
                        disabled={loading}
                    >
                        Сбросить
                    </ActionButton>
                    <ActionButton
                        size='md'
                        className={`${styles.footerButton} ${styles.fullWidthMobileButton}`}
                        type='submit'
                        variant='primary'
                        disabled={loading}
                    >
                        {loading ? 'Сохранение…' : 'Сохранить'}
                    </ActionButton>
                </div>
            </form>
        </CommonModal>
    );
};

export default EditStudentModal;
