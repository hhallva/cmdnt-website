import React from 'react';
import styles from './CommonModal.module.css';

interface CommonModalProps {
    title?: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const CommonModal: React.FC<CommonModalProps> = ({ title, isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    {title && <h3 className={styles.modalTitle}>{title}</h3>}
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>
                <div className={styles.modalBody}>{children}</div>
            </div>
        </div>
    );
};

export default CommonModal;
