import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import InputField from '../../../components/InputField/InputField';
import ActionButton from '../../../components/ActionButton/ActionButton';
import CommonModal from '../../../components/CommonModal/CommonModal';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import type { BuildingDto, BuildingSummaryDto } from '../../../types/buildings';
import type { OverallStructureStatisticDto } from '../../../types/structures';
import structureStyles from '../Structure/Structure.module.css';
import tabsStyles from '../../../components/Tabs/Tabs.module.css';

const ACTIVE_BUILDING_STORAGE_KEY = 'active-building';

const BuildingsLayout: React.FC = () => {
    const userSessionStr = typeof window !== 'undefined' ? sessionStorage.getItem('userSession') : null;
    const userSession = userSessionStr ? JSON.parse(userSessionStr) : null;
    const roleName = userSession?.role?.name?.toLowerCase() ?? '';
    const isAdmin = roleName.includes('администратор');
    const navigate = useNavigate();
    const [buildings, setBuildings] = useState<BuildingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summaryStats, setSummaryStats] = useState<OverallStructureStatisticDto | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newBuildingName, setNewBuildingName] = useState('');
    const [newBuildingAddress, setNewBuildingAddress] = useState('');
    const [newBuildingLatitude, setNewBuildingLatitude] = useState('');
    const [newBuildingLongitude, setNewBuildingLongitude] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);
    const [addressError, setAddressError] = useState<string | null>(null);
    const [newLatitudeError, setNewLatitudeError] = useState<string | null>(null);
    const [newLongitudeError, setNewLongitudeError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingDto | null>(null);
    const [buildingSummary, setBuildingSummary] = useState<BuildingSummaryDto | null>(null);
    const [buildingSummaryLoading, setBuildingSummaryLoading] = useState(false);
    const [buildingSummaryError, setBuildingSummaryError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editLatitude, setEditLatitude] = useState('');
    const [editLongitude, setEditLongitude] = useState('');
    const [editNameError, setEditNameError] = useState<string | null>(null);
    const [editAddressError, setEditAddressError] = useState<string | null>(null);
    const [editLatitudeError, setEditLatitudeError] = useState<string | null>(null);
    const [editLongitudeError, setEditLongitudeError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const selectedCoordinates = selectedBuilding?.coordinates;
    const hasCoordinates = selectedCoordinates?.latitude != null && selectedCoordinates?.longitude != null;

    const parseCoordinateInput = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return { value: null, hasValue: false, isValid: true };
        }
        const parsed = Number(trimmed.replace(',', '.'));
        if (Number.isNaN(parsed)) {
            return { value: null, hasValue: true, isValid: false };
        }
        return { value: parsed, hasValue: true, isValid: true };
    };

    useEffect(() => {
        const loadBuildings = async () => {
            try {
                setLoading(true);
                const response = await apiClient.getAllBuildings();
                setBuildings(response);
                setError(null);
            } catch (err: any) {
                console.error('Ошибка при загрузке зданий:', err);
                setError(err?.message || 'Не удалось загрузить здания');
            } finally {
                setLoading(false);
            }
        };

        loadBuildings();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const stored = sessionStorage.getItem(ACTIVE_BUILDING_STORAGE_KEY);
        if (!stored) {
            return;
        }

        try {
            const parsed = JSON.parse(stored) as { id: number };
            if (parsed?.id) {
                navigate(`/dashboard/accomodation/${parsed.id}`);
            }
        } catch {
            // Ignore invalid session storage.
        }
    }, [navigate]);

    useEffect(() => {
        const loadSummary = async () => {
            try {
                setSummaryLoading(true);
                const response = await apiClient.getOverallStructureStatistics();
                setSummaryStats(response);
                setSummaryError(null);
            } catch (err: any) {
                console.error('Ошибка при загрузке общей статистики:', err);
                setSummaryError(err?.message || 'Не удалось загрузить статистику');
            } finally {
                setSummaryLoading(false);
            }
        };

        loadSummary();
    }, []);

    const filteredBuildings = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        if (!normalized) {
            return buildings;
        }
        return buildings.filter(building => {
            const name = building.name?.toLowerCase() ?? '';
            const address = building.address?.toLowerCase() ?? '';
            return name.includes(normalized) || address.includes(normalized);
        });
    }, [buildings, searchTerm]);

    const handleOpenBuilding = useCallback((building: BuildingDto) => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(ACTIVE_BUILDING_STORAGE_KEY, JSON.stringify({
                id: building.id,
                name: building.name,
                address: building.address,
            }));
        }
        navigate(`/dashboard/accomodation/${building.id}`, { state: { building } });
    }, [navigate]);

    const handleOpenBuildingModal = useCallback(async (building: BuildingDto) => {
        setSelectedBuilding(building);
        setIsBuildingModalOpen(true);
        setBuildingSummary(null);
        setBuildingSummaryError(null);

        try {
            setBuildingSummaryLoading(true);
            const summary = await apiClient.getBuildingSummary(building.id);
            setBuildingSummary(summary);
        } catch (err: any) {
            console.error('Ошибка при загрузке сводки здания:', err);
            setBuildingSummaryError(err?.message || 'Не удалось загрузить данные здания');
        } finally {
            setBuildingSummaryLoading(false);
        }
    }, []);

    const handleCloseBuildingModal = () => {
        setIsBuildingModalOpen(false);
        setSelectedBuilding(null);
        setBuildingSummary(null);
        setBuildingSummaryError(null);
        setBuildingSummaryLoading(false);
    };

    const searchBar = (
        <div className={tabsStyles.tabsSurface} style={{ marginBottom: '2.75rem' }}>
            <div className={structureStyles.searchSection}>
                <div className={structureStyles.searchControls} style={{ gap: '1.75rem' }}>
                    <div className={structureStyles.searchInputWrapper}>
                        <InputField
                            type="text"
                            placeholder="Поиск по названию или адресу..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={structureStyles.searchButtons}>
                        <ActionButton
                            size="md"
                            variant="secondary"
                            onClick={() => setSearchTerm('')}
                            style={{ width: '13.25rem' }}
                        >
                            Сбросить
                        </ActionButton>
                    </div>
                </div>
            </div>
        </div>
    );

    const filteredTiles = useMemo(() => {
        return filteredBuildings.map((building, index) => (
            <article
                key={building.id}
                className={structureStyles.blockCard}
                onClick={() => handleOpenBuildingModal(building)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleOpenBuildingModal(building);
                    }
                }}
            >
                <div className={structureStyles.blockHeader} style={{ flexWrap: 'nowrap' }}>
                    <p className={structureStyles.blockNumber}>
                        <span className={structureStyles.blockNumberBadge}>{index + 1}</span>
                    </p>
                    <div className={structureStyles.blockMetaColumn}>
                        <p className={structureStyles.blockMeta}>
                            <span className={structureStyles.blockMetaLabel}>Здание</span>
                            <span className={structureStyles.blockMetaValue}>{building.name}</span>
                        </p>
                        <p className={structureStyles.blockMeta}>
                            <span className={structureStyles.blockMetaLabel}>Адрес</span>
                            <span className={structureStyles.blockMetaValue}>{building.address}</span>
                        </p>
                    </div>
                </div>
            </article>
        ));
    }, [filteredBuildings, handleOpenBuildingModal]);

    const listContent = useMemo(() => {
        if (error) {
            return <div className="alert alert-danger m-3">{error}</div>;
        }

        if (!buildings.length) {
            return (
                <div className={structureStyles.emptyState}>
                    <i className="bi bi-building"></i>
                    Здания не найдены.
                </div>
            );
        }

        if (!filteredBuildings.length) {
            return (
                <div className={structureStyles.emptyState}>
                    <i className="bi bi-search"></i>
                    Ничего не найдено.
                </div>
            );
        }

        return <div className={structureStyles.blocksGrid}>{filteredTiles}</div>;
    }, [buildings.length, error, filteredBuildings.length, filteredTiles]);

    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setNewBuildingName('');
        setNewBuildingAddress('');
        setNewBuildingLatitude('');
        setNewBuildingLongitude('');
        setNameError(null);
        setAddressError(null);
        setNewLatitudeError(null);
        setNewLongitudeError(null);
    };

    const handleOpenEditModal = () => {
        if (!selectedBuilding) {
            return;
        }
        setEditName(selectedBuilding.name ?? '');
        setEditAddress(selectedBuilding.address ?? '');
        setEditLatitude(selectedBuilding.coordinates?.latitude != null
            ? String(selectedBuilding.coordinates.latitude)
            : '');
        setEditLongitude(selectedBuilding.coordinates?.longitude != null
            ? String(selectedBuilding.coordinates.longitude)
            : '');
        setEditNameError(null);
        setEditAddressError(null);
        setEditLatitudeError(null);
        setEditLongitudeError(null);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditNameError(null);
        setEditAddressError(null);
        setEditLatitudeError(null);
        setEditLongitudeError(null);
    };

    const handleAddSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const name = newBuildingName.trim();
        const address = newBuildingAddress.trim();
        const latitudeInput = parseCoordinateInput(newBuildingLatitude);
        const longitudeInput = parseCoordinateInput(newBuildingLongitude);
        let hasError = false;

        if (!name) {
            setNameError('Название обязательно');
            hasError = true;
        } else if (name.length > 100) {
            setNameError('Название не более 100 символов');
            hasError = true;
        } else {
            setNameError(null);
        }

        if (!address) {
            setAddressError('Адрес обязателен');
            hasError = true;
        } else if (address.length > 300) {
            setAddressError('Адрес не более 300 символов');
            hasError = true;
        } else {
            setAddressError(null);
        }

        if (!latitudeInput.isValid) {
            setNewLatitudeError('Некорректное значение');
            hasError = true;
        } else if (latitudeInput.hasValue && (latitudeInput.value! < -90 || latitudeInput.value! > 90)) {
            setNewLatitudeError('Широта от -90 до 90');
            hasError = true;
        } else {
            setNewLatitudeError(null);
        }

        if (!longitudeInput.isValid) {
            setNewLongitudeError('Некорректное значение');
            hasError = true;
        } else if (longitudeInput.hasValue && (longitudeInput.value! < -180 || longitudeInput.value! > 180)) {
            setNewLongitudeError('Долгота от -180 до 180');
            hasError = true;
        } else {
            setNewLongitudeError(null);
        }

        if (hasError) {
            return;
        }

        setIsAdding(true);
        try {
            const created = await apiClient.createBuilding({
                name,
                address,
                coordinates: {
                    latitude: latitudeInput.value,
                    longitude: longitudeInput.value,
                },
            });
            setBuildings(prev => [created, ...prev]);
            handleCloseAddModal();
        } catch (err: any) {
            console.error('Ошибка при добавлении здания:', err);
            alert(err?.message || 'Не удалось добавить здание');
        } finally {
            setIsAdding(false);
        }
    };

    const handleEditSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedBuilding) {
            return;
        }

        const name = editName.trim();
        const address = editAddress.trim();
        const latitudeInput = parseCoordinateInput(editLatitude);
        const longitudeInput = parseCoordinateInput(editLongitude);
        let hasError = false;

        if (!name) {
            setEditNameError('Название обязательно');
            hasError = true;
        } else if (name.length > 100) {
            setEditNameError('Название не более 100 символов');
            hasError = true;
        } else {
            setEditNameError(null);
        }

        if (!address) {
            setEditAddressError('Адрес обязателен');
            hasError = true;
        } else if (address.length > 300) {
            setEditAddressError('Адрес не более 300 символов');
            hasError = true;
        } else {
            setEditAddressError(null);
        }

        if (!latitudeInput.isValid) {
            setEditLatitudeError('Некорректное значение');
            hasError = true;
        } else if (latitudeInput.hasValue && (latitudeInput.value! < -90 || latitudeInput.value! > 90)) {
            setEditLatitudeError('Широта от -90 до 90');
            hasError = true;
        } else {
            setEditLatitudeError(null);
        }

        if (!longitudeInput.isValid) {
            setEditLongitudeError('Некорректное значение');
            hasError = true;
        } else if (longitudeInput.hasValue && (longitudeInput.value! < -180 || longitudeInput.value! > 180)) {
            setEditLongitudeError('Долгота от -180 до 180');
            hasError = true;
        } else {
            setEditLongitudeError(null);
        }

        if (hasError) {
            return;
        }

        setIsUpdating(true);
        try {
            const updated = await apiClient.updateBuilding(selectedBuilding.id, {
                ...selectedBuilding,
                name,
                address,
                coordinates: {
                    latitude: latitudeInput.value,
                    longitude: longitudeInput.value,
                },
            });
            setBuildings(prev => prev.map(item => (item.id === updated.id ? updated : item)));
            setSelectedBuilding(updated);
            if (typeof window !== 'undefined') {
                const stored = sessionStorage.getItem(ACTIVE_BUILDING_STORAGE_KEY);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored) as { id: number };
                        if (parsed?.id === updated.id) {
                            sessionStorage.setItem(ACTIVE_BUILDING_STORAGE_KEY, JSON.stringify({
                                id: updated.id,
                                name: updated.name,
                                address: updated.address,
                            }));
                        }
                    } catch {
                        // Ignore invalid session storage.
                    }
                }
            }
            handleCloseEditModal();
        } catch (err: any) {
            console.error('Ошибка при обновлении здания:', err);
            alert(err?.message || 'Не удалось обновить здание');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteBuilding = async () => {
        if (!selectedBuilding || isDeleting) {
            return;
        }
        const shouldDelete = window.confirm('Удалить здание? При удалении вы потеряете все комнаты и расселение студентов.');
        if (!shouldDelete) {
            return;
        }

        setIsDeleting(true);
        try {
            await apiClient.deleteBuilding(selectedBuilding.id);
            setBuildings(prev => prev.filter(item => item.id !== selectedBuilding.id));
            if (typeof window !== 'undefined') {
                const stored = sessionStorage.getItem(ACTIVE_BUILDING_STORAGE_KEY);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored) as { id: number };
                        if (parsed?.id === selectedBuilding.id) {
                            sessionStorage.removeItem(ACTIVE_BUILDING_STORAGE_KEY);
                        }
                    } catch {
                        // Ignore invalid session storage.
                    }
                }
            }
            handleCloseBuildingModal();
        } catch (err: any) {
            console.error('Ошибка при удалении здания:', err);
            alert(err?.message || 'Не удалось удалить здание');
        } finally {
            setIsDeleting(false);
        }
    };

    const isLoading = loading || summaryLoading;

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '40vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {!summaryLoading && summaryError && (
                <div className="alert alert-danger m-3">{summaryError}</div>
            )}
            {!summaryLoading && !summaryError && summaryStats && (
                <StatisticsCard
                    stats={[
                        { value: summaryStats.totalBuildings, label: 'зданий' },
                        { value: summaryStats.totalCapacity, label: 'мест' },
                        { value: summaryStats.occupiedStudents, label: 'заселено' },
                        { value: summaryStats.totalStudents, label: 'студентов' },
                    ]}
                />
            )}
            {searchBar}
            {listContent}
            <CommonModal
                title={selectedBuilding ? selectedBuilding.name : 'Здание'}
                isOpen={isBuildingModalOpen}
                onClose={handleCloseBuildingModal}

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
                                        <span className={structureStyles.blockMetaValue}>{selectedBuilding.address || '—'}</span>
                                    </div>
                                    {hasCoordinates && (
                                        <div className={structureStyles.blockMeta}>
                                            <span className={structureStyles.blockMetaLabel}>Карта</span>
                                            <a
                                                className={structureStyles.blockMetaValue}
                                                href={`https://yandex.ru/maps/?ll=${selectedCoordinates?.longitude},${selectedCoordinates?.latitude}&z=19`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Открыть
                                            </a>
                                        </div>
                                    )}
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
                                            onClick={handleDeleteBuilding}
                                            disabled={!selectedBuilding || isDeleting}
                                        >
                                            {isDeleting ? 'Удаляем…' : 'Удалить'}
                                        </ActionButton>
                                        <ActionButton
                                            size="md"
                                            variant="secondary"
                                            onClick={handleOpenEditModal}
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
                                onClick={() => selectedBuilding && handleOpenBuilding(selectedBuilding)}
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
            {isAdmin && (
                <>
                    <div className={tabsStyles.tabsSurface} style={{ padding: '1.5rem', marginTop: '2.75rem', borderRadius: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <ActionButton size="md" variant="primary" onClick={handleOpenAddModal}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <i className="bi bi-plus"></i>
                                    <span>Добавить</span>
                                </div>
                            </ActionButton>
                        </div>
                    </div>
                    <CommonModal
                        title="Новое здание"
                        isOpen={isAddModalOpen}
                        onClose={handleCloseAddModal}
                        minWidth={520}
                    >
                        <form onSubmit={handleAddSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                <InputField
                                    label="Название"
                                    type="text"
                                    value={newBuildingName}
                                    onChange={(e) => {
                                        setNewBuildingName(e.target.value);
                                        if (nameError) {
                                            setNameError(null);
                                        }
                                    }}
                                    error={nameError ?? undefined}
                                    disabled={isAdding}
                                />
                                <InputField
                                    label="Адрес"
                                    type="text"
                                    value={newBuildingAddress}
                                    onChange={(e) => {
                                        setNewBuildingAddress(e.target.value);
                                        if (addressError) {
                                            setAddressError(null);
                                        }
                                    }}
                                    error={addressError ?? undefined}
                                    disabled={isAdding}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                    <InputField
                                        label="Долгота"
                                        type="text"
                                        value={newBuildingLongitude}
                                        onChange={(e) => {
                                            setNewBuildingLongitude(e.target.value);
                                            if (newLongitudeError) {
                                                setNewLongitudeError(null);
                                            }
                                        }}
                                        error={newLongitudeError ?? undefined}
                                        disabled={isAdding}
                                    />
                                    <InputField
                                        label="Широта"
                                        type="text"
                                        value={newBuildingLatitude}
                                        onChange={(e) => {
                                            setNewBuildingLatitude(e.target.value);
                                            if (newLatitudeError) {
                                                setNewLatitudeError(null);
                                            }
                                        }}
                                        error={newLatitudeError ?? undefined}
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
                </>
            )}
            <CommonModal
                title="Редактировать здание"
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                minWidth={520}
            >
                <form onSubmit={handleEditSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                        <InputField
                            label="Название"
                            type="text"
                            value={editName}
                            onChange={(e) => {
                                setEditName(e.target.value);
                                if (editNameError) {
                                    setEditNameError(null);
                                }
                            }}
                            error={editNameError ?? undefined}
                            disabled={isUpdating}
                        />
                        <InputField
                            label="Адрес"
                            type="text"
                            value={editAddress}
                            onChange={(e) => {
                                setEditAddress(e.target.value);
                                if (editAddressError) {
                                    setEditAddressError(null);
                                }
                            }}
                            error={editAddressError ?? undefined}
                            disabled={isUpdating}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            <InputField
                                label="Долгота"
                                type="text"
                                value={editLongitude}
                                onChange={(e) => {
                                    setEditLongitude(e.target.value);
                                    if (editLongitudeError) {
                                        setEditLongitudeError(null);
                                    }
                                }}
                                error={editLongitudeError ?? undefined}
                                disabled={isUpdating}
                            />
                            <InputField
                                label="Широта"
                                type="text"
                                value={editLatitude}
                                onChange={(e) => {
                                    setEditLatitude(e.target.value);
                                    if (editLatitudeError) {
                                        setEditLatitudeError(null);
                                    }
                                }}
                                error={editLatitudeError ?? undefined}
                                disabled={isUpdating}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <ActionButton size="md" variant="secondary" type="button" onClick={handleCloseEditModal} disabled={isUpdating}>
                                Отмена
                            </ActionButton>
                            <ActionButton size="md" variant="primary" type="submit" disabled={isUpdating}>
                                {isUpdating ? 'Сохраняем…' : 'Сохранить'}
                            </ActionButton>
                        </div>
                    </div>
                </form>
            </CommonModal>
        </>
    );
};

export default BuildingsLayout;
