import React, { type SelectHTMLAttributes } from 'react';
import styles from './SelectField.module.css';

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'label'> {
    label: string;
    options: { value: string | number; label: string }[];
}

const SelectField: React.FC<SelectFieldProps> = ({ label, options, ...selectProps }) => {
    return (
        <div className={styles.formGroup}>
            <label className={styles.formLabel}>{label}</label>
            <select
                className={styles.formSelect}
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