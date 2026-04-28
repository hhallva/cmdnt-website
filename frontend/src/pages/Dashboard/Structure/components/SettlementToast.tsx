import React from 'react';
import { createPortal } from 'react-dom';
import styles from '../Structure.module.css';

type SettlementToastProps = {
    alert: { type: 'success' | 'error'; message: string } | null;
    onClose: () => void;
};

const SettlementToast: React.FC<SettlementToastProps> = ({ alert, onClose }) => {
    if (!alert || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div className={styles.toastContainer}>
            <div className={`${styles.toast} ${alert.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                <span>{alert.message}</span>
                <button
                    type="button"
                    className={styles.toastCloseButton}
                    onClick={onClose}
                    aria-label="Закрыть уведомление"
                >
                    ×
                </button>
            </div>
        </div>,
        document.body
    );
};

export default SettlementToast;
