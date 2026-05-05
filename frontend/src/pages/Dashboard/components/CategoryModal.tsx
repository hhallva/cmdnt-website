import React from 'react';
import ActionButton from '../../../components/ActionButton/ActionButton';
import CommonModal from '../../../components/CommonModal/CommonModal';
import InputField from '../../../components/InputField/InputField';
import styles from './CategoryModal.module.css';

type CategoryModalProps = {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    name: string;
    nameError: string | null;
    isSaving: boolean;
    onNameChange: (value: string) => void;
    submitLabel: string;
};

const CategoryModal: React.FC<CategoryModalProps> = ({
    title,
    isOpen,
    onClose,
    onSubmit,
    name,
    nameError,
    isSaving,
    onNameChange,
    submitLabel,
}) => (
    <CommonModal
        title={title}
        isOpen={isOpen}
        onClose={onClose}
        minWidth={480}
        minHeight={222}
    >
        <form onSubmit={onSubmit}>
            <div className={styles.modalForm}>
                <InputField
                    label="Название"
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    error={nameError ?? undefined}
                    disabled={isSaving}
                />
                <div className={styles.modalActions}>
                    <ActionButton size="md" variant="primary" type="submit" disabled={isSaving}>
                        {submitLabel}
                    </ActionButton>
                </div>
            </div>
        </form>
    </CommonModal>
);

export default CategoryModal;
