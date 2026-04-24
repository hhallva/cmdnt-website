import React, { useMemo, useRef, useState } from 'react';
import type { ContactDto, PostStudentDto } from '../../../../types/students';
import type { GroupDto } from '../../../../types/groups';

import { apiClient } from '../../../../api/client';
import InputField from '../../../../components/InputField/InputField';
import SelectField from '../../../../components/SelectField/SelectField';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import ImageCropModal from '../../../../components/ImageCropModal/ImageCropModal';
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
            image: null,
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
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [isPhotoDragActive, setIsPhotoDragActive] = useState(false);
    const [cropSource, setCropSource] = useState<string | null>(null);
    const [isCropOpen, setIsCropOpen] = useState(false);
    const photoInputRef = useRef<HTMLInputElement | null>(null);

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

    const handlePhotoFile = (file: File | null) => {
        if (!file) {
            return;
        }
        if (!file.type.startsWith('image/')) {
            setPhotoError('Можно загрузить только изображение.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            setCropSource(result || null);
            setIsCropOpen(true);
            setPhotoError(null);
        };
        reader.onerror = () => {
            setPhotoError('Не удалось прочитать файл.');
        };
        reader.readAsDataURL(file);
    };

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        handlePhotoFile(file);
        if (event.target) {
            event.target.value = '';
        }
    };

    const handlePhotoDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (isAdding) {
            return;
        }
        setIsPhotoDragActive(false);
        const file = event.dataTransfer.files?.[0] ?? null;
        handlePhotoFile(file);
    };

    const handlePhotoDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsPhotoDragActive(true);
    };

    const handlePhotoDragLeave = () => {
        setIsPhotoDragActive(false);
    };

    const handlePhotoPick = () => {
        if (isAdding) {
            return;
        }
        photoInputRef.current?.click();
    };

    const handlePhotoKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handlePhotoPick();
        }
    };

    const handlePhotoClear = () => {
        setNewStudent(prev => ({ ...prev, image: null }));
        setPhotoPreview(null);
        setPhotoError(null);
        if (photoInputRef.current) {
            photoInputRef.current.value = '';
        }
    };

    const handleCropCancel = () => {
        setIsCropOpen(false);
        setCropSource(null);
    };

    const handleCropConfirm = (croppedDataUrl: string) => {
        const base64Payload = croppedDataUrl.includes(',') ? croppedDataUrl.split(',')[1] : croppedDataUrl;
        setNewStudent(prev => ({ ...prev, image: base64Payload || null }));
        setPhotoPreview(croppedDataUrl);
        setPhotoError(null);
        setIsCropOpen(false);
        setCropSource(null);
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

        const trimmedPhoneValue = newStudent.phone?.trim() ?? '';
        if (!trimmedPhoneValue) {
            errors.phone = 'Поле обязательно';
            isValid = false;
        } else if (!isPhoneValid(trimmedPhoneValue)) {
            errors.phone = 'Разрешен формат +7XXXXXXXXXX';
            isValid = false;
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
                contactErrors.phone = 'Разрешен формат +7XXXXXXXXXX';
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
            image: null,
        });
        setNewContacts([]);
        setFormErrors({});
        setPhotoPreview(null);
        setPhotoError(null);
        setIsCropOpen(false);
        setCropSource(null);
        if (photoInputRef.current) {
            photoInputRef.current.value = '';
        }
    };

    const handleAddSubmit = async (e: React.SyntheticEvent) => {
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
                phone: trimmedPhone,
                image: newStudent.image ?? null,
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
            <ImageCropModal
                isOpen={isCropOpen}
                imageSrc={cropSource}
                onCancel={handleCropCancel}
                onConfirm={handleCropConfirm}
            />
            <div className={styles.formSectionsWrapper} style={{ marginTop: '-0.75rem' }}>
                <section className={styles.formSection}>
                    <h4 className={styles.formSectionTitle}>Основное</h4>

                    <div className={styles.mainFormRow}>
                        <div className={styles.photoField}>
                            <div
                                className={`${styles.photoDropZone} ${isPhotoDragActive ? styles.photoDropZoneActive : ''} ${photoPreview ? styles.photoDropZoneHasImage : ''}`}
                                onClick={handlePhotoPick}
                                onKeyDown={handlePhotoKeyDown}
                                onDragOver={handlePhotoDragOver}
                                onDragLeave={handlePhotoDragLeave}
                                onDrop={handlePhotoDrop}
                                role="button"
                                tabIndex={0}
                                aria-label="Добавить фотографию"
                            >
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    className={styles.photoInput}
                                    onChange={handlePhotoChange}
                                    disabled={isAdding}
                                />
                                {photoPreview ? (
                                    <>
                                        <img src={photoPreview} alt="Превью фотографии студента" className={styles.photoPreviewImage} />
                                        <button
                                            type="button"
                                            className={styles.photoRemoveOverlay}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handlePhotoClear();
                                            }}
                                            aria-label="Удалить фото"
                                            disabled={isAdding}
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    </>
                                ) : (
                                    <div className={styles.photoIcon}>
                                        <i className="bi bi-camera"></i>
                                    </div>
                                )}
                            </div>
                            {photoError && <div className={styles.photoError}>{photoError}</div>}
                        </div>
                        <div className={styles.studentFormGrid}>
                            <div>
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
                            <div>
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
                            <div>
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
                            <div>
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
                            <div>
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
                            <div>
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
                            <div>
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
                            <div>
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
                                                <div aria-hidden="true" className={styles.pendingPlusIconDelete}>
                                                    <i className="bi bi-dash"></i>
                                                </div>
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
                                    <div className={styles.pendingPlusIcon}>
                                        <i className="bi bi-plus"></i>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className={`${styles.formSection} ${styles.formActions}`}>
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
                    className={`${styles.fullWidthMobileButton} ${styles.submitButton}`}
                    type="submit"
                    variant="primary"
                    disabled={isAdding}
                    onClick={handleAddSubmit}
                >
                    Добавить
                </ActionButton>
            </div>
        </form>
    );
};

export default AddStudentTab;
