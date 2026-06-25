import React from 'react';
import ActionButton from '../../../components/ActionButton/ActionButton';
import CommonModal from '../../../components/CommonModal/CommonModal';
import InputField from '../../../components/InputField/InputField';
import styles from '../Furniche/Furniche.module.css';

type GroupModalProps = {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    name: string;
    course: number | '';
    nameError: string | null;
    courseError: string | null;
    isSaving: boolean;
    onNameChange: (value: string) => void;
    onCourseChange: (value: number | '') => void;
    submitLabel: string;
};

const GroupModal: React.FC<GroupModalProps> = ({
    title,
    isOpen,
    onClose,
    onSubmit,
    name,
    course,
    nameError,
    courseError,
    isSaving,
    onNameChange,
    onCourseChange,
    submitLabel,
}) => (
    <CommonModal
        title={title}
        isOpen={isOpen}
        onClose={onClose}
        minWidth={480}
        minHeight={280} // чуть больше из-за двух полей
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
                <InputField
                    label="Курс"
                    type="number"
                    value={course}
                    onChange={(e) => onCourseChange(e.target.value === '' ? '' : Number(e.target.value))}
                    error={courseError ?? undefined}
                    disabled={isSaving}
                    min={1}
                    step={1}
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

export default GroupModal;