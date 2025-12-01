// src/pages/Dashboard/Students/components/PersonalInfoTab.tsx
import React from 'react';
import type { StudentsDto, ContactDto } from '../../../../types/students';
import { formatLongDate, calculateAge } from '../../../../utils/date';
import styles from '../StudentCard.module.css';

interface PersonalInfoTabProps {
    student: StudentsDto;
    contacts: ContactDto[];
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ student, contacts }) => {
    const studentAge = calculateAge(student.birthday);

    return (
        <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
                <h3 className={styles.mobileCardTitle}>Основное</h3>
                <div className={styles.blockMeta}>
                    <div className={styles.blockMetaLabel}>Дата рождения</div>
                    <div className={styles.blockMetaValue}>{formatLongDate(student.birthday)}</div>
                </div>
                <div className={styles.blockMeta}>
                    <div className={styles.blockMetaLabel}>Возраст</div>
                    <div className={styles.blockMetaValue}>{studentAge !== null ? `${studentAge} лет` : 'Нет данных'}</div>
                </div>
                <div className={styles.blockMeta}>
                    <div className={styles.blockMetaLabel}>Пол</div>
                    <div className={styles.blockMetaValue}>{student.gender ? 'Мужской' : 'Женский'}</div>
                </div>
                <div className={styles.blockMeta}>
                    <div className={styles.blockMetaLabel}>Населенный пункт</div>
                    <div className={styles.blockMetaValue}>{student?.origin || 'Нет'}</div>
                </div>
            </div>

            <div className={styles.infoCard}>
                <h3 className={styles.mobileCardTitle}>Обучение</h3>
                <div className={styles.blockMeta}>
                    <div className={styles.blockMetaLabel}>Группа</div>
                    <div className={styles.blockMetaValue}>{student.group?.name || 'Нет'}</div>
                </div>
                <div className={styles.blockMeta}>
                    <div className={styles.blockMetaLabel}>Курс</div>
                    <div className={styles.blockMetaValue}>{student.group?.course || 'Нет'}</div>
                </div>
            </div>

            <div className={styles.infoCard}>
                <h3 className={styles.mobileCardTitle}>Контакты</h3>
                <div className={styles.blockMeta}>
                    <div className={styles.blockMetaLabel}>Телефон</div>
                    <div className={styles.blockMetaValue}>{student.phone || 'Нет'}</div>
                </div>
                <div className={styles.mobileCardTitle + ' mt-2'}>Дополнительно</div>
                {contacts.length > 0 ? (
                    contacts.map((contact, index) => (
                        <div key={index} className={styles.blockMeta}>
                            <div className={styles.blockMetaLabel}>{contact.comment || ''}</div>
                            <div className={styles.blockMetaValue}>{contact.phone}</div>
                        </div>
                    ))
                ) : (
                    <div className={styles.infoValue}>Нет дополнительных контактов</div>
                )}
            </div>
        </div >
    );
};

export default PersonalInfoTab;