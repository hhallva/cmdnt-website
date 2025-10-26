import React, { type InputHTMLAttributes } from 'react';
import styles from './InputField.module.css';

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'label'> {
    label: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, ...inputProps }) => {
    return (
        <div className={styles.formGroup}>
            <label className={styles.formLabel}>{label}</label>
            <input
                className={styles.formControl}
                {...inputProps}
            />
        </div>
    );
};

export default InputField;