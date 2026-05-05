// src/components/SelectField/SelectField.tsx
import React, { type SelectHTMLAttributes } from 'react';
import styles from './SelectField.module.css';

// Используем Omit, чтобы исключить label и error из стандартных атрибутов select
interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'label' | 'error'> {
    label?: string;
    options: { value: string | number; label: string }[];
    error?: string; // Добавляем пропс для ошибки
    labelClassName?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, options, error, labelClassName, ...selectProps }) => {
    return (
        <div className={styles.formGroup}>
            {(label || error) && (
                <div className={styles.labelRow}>
                    {label && <label className={`${styles.formLabel} ${labelClassName ?? ''}`}>{label}</label>}
                    {error && <span className={styles.inlineError}>{error}</span>}
                </div>
            )}

            <select
                className={`${styles.formSelect} ${error ? styles.isInvalid : ''}`}
                {...selectProps}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SelectField;