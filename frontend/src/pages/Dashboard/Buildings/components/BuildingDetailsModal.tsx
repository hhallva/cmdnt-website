import React from 'react';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import type { BuildingDto, BuildingSummaryDto } from '../../../../types/buildings';
import structureStyles from '../../Structure/Structure.module.css';

type BuildingDetailsModalProps = {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    selectedBuilding: BuildingDto | null;
    buildingSummary: BuildingSummaryDto | null;
    buildingSummaryLoading: boolean;
    buildingSummaryError: string | null;
    isAdmin: boolean;
    isDeleting: boolean;
    onDelete: () => void;
    onEdit: () => void;
    onOpenStructure: () => void;
};

const BuildingDetailsModal: React.FC<BuildingDetailsModalProps> = ({
    title,
    isOpen,
    onClose,
    selectedBuilding,
    buildingSummary,
    buildingSummaryLoading,
    buildingSummaryError,
    isAdmin,
    isDeleting,
    onDelete,
    onEdit,
    onOpenStructure,
}) => {
    const selectedCoordinates = selectedBuilding?.coordinates;
    const hasCoordinates = selectedCoordinates?.latitude != null && selectedCoordinates?.longitude != null;

    return (
        <CommonModal
            title={title}
            isOpen={isOpen}
            onClose={onClose}
            minWidth={520}
            minHeight={210}
        >
            <div className={structureStyles.modalLoadingWrapper}>
                <div className={`${structureStyles.modalContentWrapper} ${buildingSummaryLoading ? structureStyles.modalContentHidden : ''}`}>
                    {selectedBuilding && (
                        <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
                            <div className={structureStyles.blockMetaColumn}>
                                <div className={structureStyles.blockMeta}>
                                    <span className={structureStyles.blockMetaLabel}>Этажи</span>
                                    <span className={structureStyles.blockMetaValue}>
                                        {buildingSummary ? buildingSummary.totalFloors : '—'}
                                    </span>
                                </div>
                                <div className={structureStyles.blockMeta}>
                                    <span className={structureStyles.blockMetaLabel}>Заселено</span>
                                    <span className={structureStyles.blockMetaValue}>
                                        {buildingSummary ? `${buildingSummary.occupiedCount}/${buildingSummary.totalCapacity}` : '—'}
                                    </span>
                                </div>
                            </div>
                            <div className={structureStyles.blockMetaColumn}>
                                <div className={structureStyles.blockMeta}>
                                    <span className={structureStyles.blockMetaLabel}>Адрес</span>
                                    {hasCoordinates ? (
                                        <a
                                            className={structureStyles.blockMetaValue}
                                            href={`https://yandex.ru/maps/?ll=${selectedCoordinates?.longitude},${selectedCoordinates?.latitude}&z=19`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {selectedBuilding.address || '—'}
                                        </a>
                                    ) : (
                                        <span className={structureStyles.blockMetaValue}>{selectedBuilding.address || '—'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!buildingSummaryLoading && buildingSummaryError && (
                        <div className="alert alert-danger">{buildingSummaryError}</div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-start' }}>
                            {isAdmin && (
                                <>
                                    <ActionButton
                                        size="md"
                                        variant="danger"
                                        onClick={onDelete}
                                        disabled={!selectedBuilding || isDeleting}
                                    >
                                        {isDeleting ? 'Удаляем…' : 'Удалить'}
                                    </ActionButton>
                                    <ActionButton
                                        size="md"
                                        variant="secondary"
                                        onClick={onEdit}
                                        disabled={!selectedBuilding}
                                    >
                                        Редактировать
                                    </ActionButton>
                                </>
                            )}
                        </div>
                        <ActionButton
                            size="md"
                            variant="primary"
                            onClick={onOpenStructure}
                            disabled={!selectedBuilding}
                        >
                            Структура
                        </ActionButton>
                    </div>
                </div>

                {buildingSummaryLoading && (
                    <div className={structureStyles.modalLoadingOverlay}>
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                    </div>
                )}
            </div>
        </CommonModal>
    );
};

export default BuildingDetailsModal;
