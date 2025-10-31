// src/components/ActionButton/ActionButton.tsx
import React from 'react';
import styles from './ActionButton.module.css'; // Создадим стили позже

interface ActionButtonProps {
    onClick: () => void;
    children: React.ReactNode; // Содержимое кнопки (текст, иконки)
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline-primary' | 'outline-secondary'; // Примеры вариантов
    size?: 'sm' | 'md' | 'lg'; // Размеры
    disabled?: boolean;
    ariaLabel?: string; // Для доступности
    className?: string; // Дополнительные классы
    type?: 'button' | 'submit' | 'reset';
    style?: React.CSSProperties; // Inline стили
}

const ActionButton: React.FC<ActionButtonProps> = ({
    onClick,
    children,
    variant = 'primary', // По умолчанию
    size = 'md',
    disabled = false,
    ariaLabel,
    className = '',
    type = 'button',
    style = {},
    ...restProps // Для передачи других пропсов, если нужно
}) => {
    return (
        <>
            <button type={type} className={`${styles.actionButton} 
                         ${styles[`variant-${variant}`]} 
                         ${disabled ? styles.disabled : ''} 
                         ${className}`}
                onClick={!disabled ? onClick : undefined}
                aria-label={ariaLabel}
                aria-disabled={disabled}
                style={style}
                {...restProps}
                tabIndex={disabled ? -1 : 0}
            >
                {children}
            </button>
        </>

    );
};

export default ActionButton;