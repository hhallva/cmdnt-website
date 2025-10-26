import React, { useState, type InputHTMLAttributes } from 'react';
import InputField from '../InputField/InputField';
import styles from './PasswordField.module.css';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'label' | 'type' | 'error'> {
    label: string;
    error?: string;

}

const PasswordField: React.FC<PasswordFieldProps> = ({ label, error, ...inputProps }) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={styles.passwordFieldContainer}>
            <InputField
                label={label}
                type={showPassword ? "text" : "password"}
                error={error}
                {...inputProps}
            >
            </InputField>
            <button
                type="button"
                className={styles.toggleButton}
                onClick={togglePasswordVisibility}
                disabled={inputProps.disabled}
                tabIndex={inputProps.disabled ? -1 : undefined}
            >
                {showPassword ?
                    (<i className="bi bi-eye-slash"></i>) :
                    (<i className="bi bi-eye"></i>)}
            </button>
        </div>
    );
};

export default PasswordField;