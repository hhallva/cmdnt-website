import React from 'react';
import styles from './CancelButton.module.css';

interface CancelButtonProps {
    onClick: () => void;
    label?: string;
}

const CancelButton: React.FC<CancelButtonProps> = ({ onClick, label = 'Сбросить' }) => {
    return (
        <button
            className={styles.cancelButton}
            onClick={onClick}>
            {label}
        </button>
    );
};

export default CancelButton;