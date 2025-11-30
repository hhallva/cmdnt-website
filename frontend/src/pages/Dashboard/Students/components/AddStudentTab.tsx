import React, { useMemo, useState } from 'react';
import type { ContactDto, PostStudentDto } from '../../../../types/students';
import type { GroupDto } from '../../../../types/groups';

import { apiClient } from '../../../../api/client';
import InputField from '../../../../components/InputField/InputField';
import SelectField from '../../../../components/SelectField/SelectField';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import { isPhoneValid } from '../../../../utils/students';

import styles from '../Students.module.css';

interface AddStudentTabProps {
    groups: GroupDto[];
    onStudentCreated: () => Promise<void> | void;
}

const AddStudentTab: React.FC<AddStudentTabProps> = ({ groups, onStudentCreated }) => {
    const [newStudent, setNewStudent] = useState<Omit<PostStudentDto, 'id'> & { id?: number }>(
        {
            name: '',
            surname: '',
            patronymic: '',
            birthday: '',
            groupId: null,
            gender: null,
            phone: '',
            origin: null,
        }
    );
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
        form?: string;
    }>({});
    const [isAdding, setIsAdding] = useState(false);

    const sortedGroups = useMemo(() => (
        [...groups].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ru', { sensitivity: 'base' }))
    ), [groups]);

    const groupOptions = useMemo(() => [
        { value: '', label: 'Выберите группу' },
        ...sortedGroups.map(group => ({ value: group.id, label: group.name })),
    ], [sortedGroups]);

    const genderOptions = [
        { value: '', label: 'Выберите пол' },
        { value: 'true', label: 'Мужской' },
        { value: 'false', label: 'Женский' },
    ];

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
            const nextContacts = [...prev];
            nextContacts[index] = { ...nextContacts[index], [field]: value };
            return nextContacts;
        });

        setFormErrors(prev => {
            if (prev.contacts && prev.contacts[index]) {
                const nextContacts = [...prev.contacts];
                nextContacts[index] = { ...nextContacts[index], [field]: undefined };
                return { ...prev, contacts: nextContacts };
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
        const errors: typeof formErrors = {};
        let isValid = true;

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

        if (!newStudent.groupId || newStudent.groupId <= 0) {
            errors.groupId = 'Поле обязательно';
            isValid = false;
        }

        if (newStudent.phone?.trim()) {
            if (!isPhoneValid(newStudent.phone)) {
                errors.phone = 'Разрешен формат 8XXXXXXXXXX';
                isValid = false;
            }
        }

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
            } else if (!isPhoneValid(contact.phone)) {
                contactErrors.phone = 'Разрешен формат 8XXXXXXXXXX';
                contactsValid = false;
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
        setNewContacts([]);
        setFormErrors({});
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsAdding(true);
        try {
            const trimmedOrigin = newStudent.origin?.trim() ?? '';
            const trimmedPhone = newStudent.phone?.trim() ?? '';
            const studentDataToSend: PostStudentDto = {
                ...newStudent,
                groupId: newStudent.groupId && newStudent.groupId !== 0 ? newStudent.groupId : null,
                origin: trimmedOrigin ? trimmedOrigin : null,
                phone: trimmedPhone ? trimmedPhone : null,
            };

            const createdStudent = await apiClient.createStudent(studentDataToSend);

            if (newContacts.length > 0) {
                try {
                    const contactsToSend: Omit<ContactDto, 'id'>[] = newContacts.map(c => ({
                        comment: c.comment.trim(),
                        phone: c.phone.trim(),
                    }));
                    await apiClient.addStudentContacts(createdStudent.id, contactsToSend);
                } catch (contactErr: any) {
                    console.error('Ошибка при добавлении контактов:', contactErr);
                    alert(`Студент "${createdStudent.surname}" успешно добавлен, но контакты сохранить не удалось: ${contactErr.message || 'Неизвестная ошибка'}`);
                }
            }

            resetAddForm();
            await onStudentCreated?.();
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при добавлении студента';
            setFormErrors(prev => ({ ...prev, form: errorMessage }));
        } finally {
            setIsAdding(false);
        }
    };

    return (
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
                                    newStudent.gender === true ? 'true'
                                        : newStudent.gender === false ? 'false'
                                            : ''
                                }
                                onChange={handleAddChange}
                                options={genderOptions}
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
                                options={groupOptions}
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
                                                variant="secondary"
                                                size="md"
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

            <div className={`${styles.formSection} mt-4 d-flex justify-content-end`}>
                <ActionButton
                    size="md"
                    className={styles.fullWidthMobileButton}
                    variant="secondary"
                    onClick={resetAddForm}
                    disabled={isAdding}
                >
                    Сбросить
                </ActionButton>
                <ActionButton
                    size="md"
                    className={`${styles.fullWidthMobileButton} ms-2`}
                    type="submit"
                    variant="primary"
                    disabled={isAdding}
                >
                    Добавить
                </ActionButton>
            </div>
        </form>
    );
};

export default AddStudentTab;
