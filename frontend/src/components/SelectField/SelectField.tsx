// src/components/SelectField/SelectField.tsx
import React, { type SelectHTMLAttributes } from 'react';
import styles from './SelectField.module.css';

// Используем Omit, чтобы исключить label и error из стандартных атрибутов select
interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'label' | 'error'> {
    label: string;
    options: { value: string | number; label: string }[];
    error?: string; // Добавляем пропс для ошибки
}

const SelectField: React.FC<SelectFieldProps> = ({ label, options, error, ...selectProps }) => {
    return (
        <div className={styles.formGroup}>
            <label className={styles.formLabel}>{label}</label>
            <select
                className={`${styles.formSelect} ${error ? styles.isInvalid : ''}`} // Добавляем класс при ошибке
                {...selectProps}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {/* Отображаем сообщение об ошибке, если оно есть */}
            {error && <div className={styles.invalidFeedback}>{error}</div>}
        </div>
    );
};

export default SelectField;