// src/components/InputField/InputField.tsx
import React, { type InputHTMLAttributes } from 'react';
import styles from './InputField.module.css';

// Используем Omit, чтобы исключить label и error из стандартных атрибутов input
interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'label' | 'error'> {
    label?: string;
    error?: string; // Добавляем пропс для ошибки
    inputClassName?: string;
    children?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ label, error, inputClassName, children, ...inputProps }) => {
    const { className, ...restInputProps } = inputProps;

    const inputClasses = [
        styles.formControl,
        error ? styles.isInvalid : '',
        inputClassName,
        className,
    ].filter((cls): cls is string => Boolean(cls)).join(' ');

    const wrapperClasses = [
        styles.inputWrapper,
        children ? styles.inputWrapperHasAddon : '',
    ].filter((cls): cls is string => Boolean(cls)).join(' ');

    return (
        <div className={styles.formGroup}>
            {(label || error) && (
                <div className={styles.labelRow}>
                    {label && <label className={styles.formLabel}>{label}</label>}
                    {error && <span className={styles.inlineError}>{error}</span>}
                </div>
            )}
            <div className={wrapperClasses}>
                <input
                    className={inputClasses}
                    {...restInputProps}
                />
                {children}
            </div>
        </div>
    );
};

export default InputField;