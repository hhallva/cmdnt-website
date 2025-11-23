import React from 'react';
import styles from './CommonModal.module.css';

interface CommonModalProps {
    title?: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const CommonModal: React.FC<CommonModalProps> = ({ title, isOpen, onClose, children }) => {
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    {title && <h3 className={styles.modalTitle}>{title}</h3>}
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>
                <div className={styles.modalBody} style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
            </div>
        </div>
    );
};

export default CommonModal;
