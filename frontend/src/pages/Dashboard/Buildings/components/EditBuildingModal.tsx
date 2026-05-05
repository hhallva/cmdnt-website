import React from 'react';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import InputField from '../../../../components/InputField/InputField';
import ActionButton from '../../../../components/ActionButton/ActionButton';

type EditBuildingModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: React.FormEvent) => void;
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    nameError: string | null;
    addressError: string | null;
    latitudeError: string | null;
    longitudeError: string | null;
    isUpdating: boolean;
    onNameChange: (value: string) => void;
    onAddressChange: (value: string) => void;
    onLatitudeChange: (value: string) => void;
    onLongitudeChange: (value: string) => void;
};

const EditBuildingModal: React.FC<EditBuildingModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    name,
    address,
    latitude,
    longitude,
    nameError,
    addressError,
    latitudeError,
    longitudeError,
    isUpdating,
    onNameChange,
    onAddressChange,
    onLatitudeChange,
    onLongitudeChange,
}) => (
    <CommonModal
        title="Редактировать здание"
        isOpen={isOpen}
        onClose={onClose}
        minWidth={520}
    >
        <form onSubmit={onSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <InputField
                    label="Название"
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    error={nameError ?? undefined}
                    disabled={isUpdating}
                />
                <InputField
                    label="Адрес"
                    type="text"
                    value={address}
                    onChange={(e) => onAddressChange(e.target.value)}
                    error={addressError ?? undefined}
                    disabled={isUpdating}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <InputField
                        label="Долгота"
                        type="text"
                        value={longitude}
                        onChange={(e) => onLongitudeChange(e.target.value)}
                        error={longitudeError ?? undefined}
                        disabled={isUpdating}
                    />
                    <InputField
                        label="Широта"
                        type="text"
                        value={latitude}
                        onChange={(e) => onLatitudeChange(e.target.value)}
                        error={latitudeError ?? undefined}
                        disabled={isUpdating}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <ActionButton size="md" variant="secondary" type="button" onClick={onClose} disabled={isUpdating}>
                        Отмена
                    </ActionButton>
                    <ActionButton size="md" variant="primary" type="submit" disabled={isUpdating}>
                        {isUpdating ? 'Сохраняем…' : 'Сохранить'}
                    </ActionButton>
                </div>
            </div>
        </form>
    </CommonModal>
);

export default EditBuildingModal;
