import React from 'react';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import InputField from '../../../../components/InputField/InputField';
import styles from '../Structure.module.css';

type NewRoomFormState = {
    floorNumber: string;
    roomNumber: string;
    capacity: string;
};

type NewRoomFormErrors = Partial<Record<keyof NewRoomFormState, string>>;

type AddRoomModalProps = {
    isOpen: boolean;
    isCreating: boolean;
    form: NewRoomFormState;
    errors: NewRoomFormErrors;
    onClose: () => void;
    onFieldChange: (field: keyof NewRoomFormState, value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const AddRoomModal: React.FC<AddRoomModalProps> = ({
    isOpen,
    isCreating,
    form,
    errors,
    onClose,
    onFieldChange,
    onSubmit,
}) => (
    <CommonModal
        title="Добавить комнату"
        isOpen={isOpen}
        onClose={onClose}
        minWidth={520}
        minHeight={380}
    >
        <form className={styles.addRoomForm} onSubmit={onSubmit}>
            <div className={styles.addRoomFormGrid}>
                <InputField
                    label="Номер этажа"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.floorNumber}
                    onChange={(e) => onFieldChange('floorNumber', e.target.value)}
                    disabled={isCreating}
                    error={errors.floorNumber}
                />
                <InputField
                    label="Номер комнаты"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.roomNumber}
                    onChange={(e) => onFieldChange('roomNumber', e.target.value)}
                    disabled={isCreating}
                    error={errors.roomNumber}
                />
                <InputField
                    label="Вместимость"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.capacity}
                    onChange={(e) => onFieldChange('capacity', e.target.value)}
                    disabled={isCreating}
                    error={errors.capacity}
                />
            </div>
            <div className={styles.addRoomActions}>
                <ActionButton
                    size="md"
                    variant="secondary"
                    type="button"
                    className={styles.fullWidthMobileButton}
                    onClick={onClose}
                    disabled={isCreating}
                >
                    Отмена
                </ActionButton>
                <ActionButton
                    size="md"
                    variant="primary"
                    type="submit"
                    className={styles.fullWidthMobileButton}
                    disabled={isCreating}
                >
                    {isCreating ? 'Добавляем…' : 'Добавить'}
                </ActionButton>
            </div>
        </form>
    </CommonModal>
);

export default AddRoomModal;
