import React from 'react';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import InputField from '../../../../components/InputField/InputField';
import ActionButton from '../../../../components/ActionButton/ActionButton';

type AddBuildingModalProps = {
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
    isAdding: boolean;
    onNameChange: (value: string) => void;
    onAddressChange: (value: string) => void;
    onLatitudeChange: (value: string) => void;
    onLongitudeChange: (value: string) => void;
};

const AddBuildingModal: React.FC<AddBuildingModalProps> = ({
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
    isAdding,
    onNameChange,
    onAddressChange,
    onLatitudeChange,
    onLongitudeChange,
}) => (
    <CommonModal
        title="Новое здание"
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
                    disabled={isAdding}
                />
                <InputField
                    label="Адрес"
                    type="text"
                    value={address}
                    onChange={(e) => onAddressChange(e.target.value)}
                    error={addressError ?? undefined}
                    disabled={isAdding}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <InputField
                        label="Долгота"
                        type="text"
                        value={longitude}
                        onChange={(e) => onLongitudeChange(e.target.value)}
                        error={longitudeError ?? undefined}
                        disabled={isAdding}
                    />
                    <InputField
                        label="Широта"
                        type="text"
                        value={latitude}
                        onChange={(e) => onLatitudeChange(e.target.value)}
                        error={latitudeError ?? undefined}
                        disabled={isAdding}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <ActionButton size="md" variant="primary" type="submit" disabled={isAdding}>
                        {isAdding ? 'Добавляем…' : 'Добавить'}
                    </ActionButton>
                </div>
            </div>
        </form>
    </CommonModal>
);

export default AddBuildingModal;
