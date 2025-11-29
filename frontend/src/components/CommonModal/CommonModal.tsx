import React from 'react';
import styles from './CommonModal.module.css';

interface CommonModalProps {
    title?: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    minWidth?: number | string;
    minHeight?: number | string;
}

const toCssSize = (value?: number | string) => {
    if (value === undefined) return undefined;
    return typeof value === 'number' ? `${value}px` : value;
};

const CommonModal: React.FC<CommonModalProps> = ({ title, isOpen, onClose, children, minWidth, minHeight }) => {
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

    const contentStyle = {
        '--modal-min-width': toCssSize(minWidth),
        '--modal-min-height': toCssSize(minHeight),
    } as React.CSSProperties;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={contentStyle}>
                <div className={styles.modalHeader}>
                    {title && (
                        <div className={styles.modalTitle}>
                            {typeof title === 'string' ? <span>{title}</span> : title}
                        </div>
                    )}
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>
                <div className={styles.modalBody}>{children}</div>
            </div>
        </div>
    );
};

export default CommonModal;
