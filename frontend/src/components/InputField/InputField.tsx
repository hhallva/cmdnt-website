// src/components/InputField/InputField.tsx
import React, { type InputHTMLAttributes } from 'react';
import styles from './InputField.module.css';

// Используем Omit, чтобы исключить label и error из стандартных атрибутов input
interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'label' | 'error'> {
    label?: string;
    error?: string; // Добавляем пропс для ошибки
}

const InputField: React.FC<InputFieldProps> = ({ label, error, ...inputProps }) => {
    return (
        <div className={styles.formGroup}>
            {label && <label className={styles.formLabel}>{label}</label>}
            <input
                className={`${styles.formControl} ${error ? styles.isInvalid : ''}`} // Добавляем класс при ошибке
                {...inputProps}
            />
            {error && <div className={styles.invalidFeedback}>{error}</div>}
        </div>
    );
};

export default InputField;