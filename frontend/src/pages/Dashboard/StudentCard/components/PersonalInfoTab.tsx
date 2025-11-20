// src/pages/Dashboard/Students/components/PersonalInfoTab.tsx
import React from 'react';
import type { StudentsDto, ContactDto, ExtStudentData } from '../../../../types/students';
import { formatLongDate, calculateAge } from '../../../../utils/date';
import styles from '../StudentCard.module.css';

interface PersonalInfoTabProps {
    student: StudentsDto;
    contacts: ContactDto[];
    extStudent?: ExtStudentData;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ student, contacts, extStudent }) => {
    const studentAge = calculateAge(student.birthday);

    return (
        <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Основная информация</h3>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Фамилия Имя Отчество</div>
                    <div className={styles.infoValue}>
                        {student.surname || 'Нет'} {student.name || 'Нет'} {student.patronymic || ''}
                    </div>
                </div>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Дата рождения</div>
                    <div className={styles.infoValue}>{formatLongDate(student.birthday)}</div>
                </div>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Возраст</div>
                    <div className={styles.infoValue}>{studentAge !== null ? `${studentAge} лет` : 'Нет данных'}</div>
                </div>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Пол</div>
                    <div className={styles.infoValue}>{student.gender ? 'Мужской' : 'Женский'}</div>
                </div>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Откуда приехал</div>
                    <div className={styles.infoValue}>{extStudent?.origin || 'Нет'}</div>
                </div>
            </div>

            <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Учебная информация</h3>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Группа</div>
                    <div className={styles.infoValue}>{student.group?.name || 'Нет'}</div>
                </div>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Курс</div>
                    <div className={styles.infoValue}>{student.group?.course || 'Нет'}</div>
                </div>
            </div>

            <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Контактная информация</h3>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Телефон</div>
                    <div className={styles.infoValue}>{student.phone || 'Нет'}</div>
                </div>
                <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Контакты</div>
                    {contacts.length > 0 ? (
                        contacts.map((contact, index) => (
                            <div key={index} className={styles.infoItem}>
                                <div className={styles.infoValue}>
                                    {contact.comment || 'Без комментария'} <br /> {contact.phone}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.infoValue}>Нет дополнительных контактов</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalInfoTab;