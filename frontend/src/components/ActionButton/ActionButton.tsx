// src/components/ActionButton/ActionButton.tsx
import React from 'react';
import styles from './ActionButton.module.css'; // Создадим стили позже

interface ActionButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline-primary' | 'outline-secondary'; // Примеры вариантов
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    ariaLabel?: string;
    className?: string;
    style?: React.CSSProperties;
    type?: 'button' | 'submit' | 'reset';
    name?: string;
    value?: string | number;
}

const ActionButton: React.FC<ActionButtonProps> = ({
    onClick,
    children,
    variant = 'primary',
    size = 'lg',
    disabled = false,
    ariaLabel,
    className = '',
    style = {},
    type = 'button',
    name,
    value,
    ...restProps
}) => {
    return (
        <>
            <button
                type={type}
                name={name}
                value={value}
                className={`
                    ${styles.actionButton} 
                    ${styles[`variant-${variant}`]} 
                    ${styles[`size-${size}`]} 
                    ${disabled ? styles.disabled : ''} 
                    ${className}
                `}
                onClick={!disabled ? onClick : undefined}
                aria-label={ariaLabel}
                style={style}
                aria-disabled={disabled}
                {...restProps}
            >
                {children}
            </button>
        </>

    );
};

export default ActionButton;