import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import InputField from '../../../components/InputField/InputField';
import ActionButton from '../../../components/ActionButton/ActionButton';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import type { BuildingDto, BuildingSummaryDto } from '../../../types/buildings';
import type { OverallStructureStatisticDto } from '../../../types/structures';


import AddBuildingModal from './components/AddBuildingModal';
import BuildingDetailsModal from './components/BuildingDetailsModal';
import EditBuildingModal from './components/EditBuildingModal';
import styles from './BuildingsLayout.module.css';
import structureStyles from '../Structure/Structure.module.css';
import tabsStyles from '../../../components/Tabs/Tabs.module.css';

const ACTIVE_BUILDING_STORAGE_KEY = 'active-building';

type BuildingFormValidationResult = {
    nameError: string | null;
    addressError: string | null;
    latitudeError: string | null;
    longitudeError: string | null;
    latitude: number | null;
    longitude: number | null;
    hasError: boolean;
};

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

    const validateBuildingForm = (nameValue: string, addressValue: string, latitudeValue: string, longitudeValue: string): BuildingFormValidationResult => {
        const name = nameValue.trim();
        const address = addressValue.trim();
        const latitudeInput = parseCoordinateInput(latitudeValue);
        const longitudeInput = parseCoordinateInput(longitudeValue);

        const nameError = !name
            ? 'Название обязательно'
            : name.length > 100
                ? 'Название не более 100 символов'
                : null;

        const addressError = !address
            ? 'Адрес обязателен'
            : address.length > 300
                ? 'Адрес не более 300 символов'
                : null;

        const latitudeError = !latitudeInput.isValid
            ? 'Некорректное значение'
            : latitudeInput.hasValue && (latitudeInput.value! < -90 || latitudeInput.value! > 90)
                ? 'Широта от -90 до 90'
                : null;

        const longitudeError = !longitudeInput.isValid
            ? 'Некорректное значение'
            : longitudeInput.hasValue && (longitudeInput.value! < -180 || longitudeInput.value! > 180)
                ? 'Долгота от -180 до 180'
                : null;

        return {
            nameError,
            addressError,
            latitudeError,
            longitudeError,
            latitude: latitudeInput.value,
            longitude: longitudeInput.value,
            hasError: Boolean(nameError || addressError || latitudeError || longitudeError),
        };
    };

    const withErrorReset = (
        setValue: React.Dispatch<React.SetStateAction<string>>,
        error: string | null,
        setError: React.Dispatch<React.SetStateAction<string | null>>,
    ) => (value: string) => {
        setValue(value);
        if (error) {
            setError(null);
        }
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
        let furnitureEquipmentId: number | undefined;
        if (typeof window !== 'undefined') {
            const pendingFurniture = sessionStorage.getItem('pending-furniture-equipment');
            if (pendingFurniture) {
                const parsed = Number(pendingFurniture);
                if (!Number.isNaN(parsed)) {
                    furnitureEquipmentId = parsed;
                }
                sessionStorage.removeItem('pending-furniture-equipment');
            }
        }

        navigate(`/dashboard/accomodation/${building.id}`, {
            state: {
                building,
                furnitureEquipmentId,
            },
        });
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
        <div className={`${tabsStyles.tabsSurface} ${styles.searchBarSurface}`}>
            <div className={structureStyles.searchSection}>
                <div className={`${structureStyles.searchControls} ${styles.searchControls}`}>
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
                            className={styles.resetButton}
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
        const validation = validateBuildingForm(newBuildingName, newBuildingAddress, newBuildingLatitude, newBuildingLongitude);

        setNameError(validation.nameError);
        setAddressError(validation.addressError);
        setNewLatitudeError(validation.latitudeError);
        setNewLongitudeError(validation.longitudeError);

        if (validation.hasError) {
            return;
        }

        setIsAdding(true);
        try {
            const created = await apiClient.createBuilding({
                name,
                address,
                coordinates: {
                    latitude: validation.latitude,
                    longitude: validation.longitude,
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
        const validation = validateBuildingForm(editName, editAddress, editLatitude, editLongitude);

        setEditNameError(validation.nameError);
        setEditAddressError(validation.addressError);
        setEditLatitudeError(validation.latitudeError);
        setEditLongitudeError(validation.longitudeError);

        if (validation.hasError) {
            return;
        }

        setIsUpdating(true);
        try {
            const updated = await apiClient.updateBuilding(selectedBuilding.id, {
                ...selectedBuilding,
                name,
                address,
                coordinates: {
                    latitude: validation.latitude,
                    longitude: validation.longitude,
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
                <div className={styles.summarySection}>
                    <StatisticsCard
                        stats={[
                            { value: summaryStats.totalBuildings, label: 'зданий' },
                            { value: summaryStats.totalCapacity, label: 'мест' },
                            { value: summaryStats.occupiedStudents, label: 'заселено' },
                            { value: summaryStats.totalStudents, label: 'студентов' },
                        ]}
                    />
                </div>
            )}
            {searchBar}
            {listContent}
            <BuildingDetailsModal
                title={selectedBuilding ? selectedBuilding.name : 'Здание'}
                isOpen={isBuildingModalOpen}
                onClose={handleCloseBuildingModal}
                selectedBuilding={selectedBuilding}
                buildingSummary={buildingSummary}
                buildingSummaryLoading={buildingSummaryLoading}
                buildingSummaryError={buildingSummaryError}
                isAdmin={isAdmin}
                isDeleting={isDeleting}
                onDelete={handleDeleteBuilding}
                onEdit={handleOpenEditModal}
                onOpenStructure={() => selectedBuilding && handleOpenBuilding(selectedBuilding)}
            />
            {isAdmin && (
                <>
                    <div className={`${tabsStyles.tabsSurface} ${styles.addPanel}`}>
                        <div className={styles.addPanelActions}>
                            <ActionButton size="md" variant="primary" onClick={handleOpenAddModal}>
                                <div className={styles.addButtonInner}>
                                    <i className="bi bi-plus"></i>
                                    <span>Добавить</span>
                                </div>
                            </ActionButton>
                        </div>
                    </div>
                    <AddBuildingModal
                        isOpen={isAddModalOpen}
                        onClose={handleCloseAddModal}
                        onSubmit={handleAddSubmit}
                        name={newBuildingName}
                        address={newBuildingAddress}
                        latitude={newBuildingLatitude}
                        longitude={newBuildingLongitude}
                        nameError={nameError}
                        addressError={addressError}
                        latitudeError={newLatitudeError}
                        longitudeError={newLongitudeError}
                        isAdding={isAdding}
                        onNameChange={withErrorReset(setNewBuildingName, nameError, setNameError)}
                        onAddressChange={withErrorReset(setNewBuildingAddress, addressError, setAddressError)}
                        onLatitudeChange={withErrorReset(setNewBuildingLatitude, newLatitudeError, setNewLatitudeError)}
                        onLongitudeChange={withErrorReset(setNewBuildingLongitude, newLongitudeError, setNewLongitudeError)}
                    />
                </>
            )}
            <EditBuildingModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSubmit={handleEditSubmit}
                name={editName}
                address={editAddress}
                latitude={editLatitude}
                longitude={editLongitude}
                nameError={editNameError}
                addressError={editAddressError}
                latitudeError={editLatitudeError}
                longitudeError={editLongitudeError}
                isUpdating={isUpdating}
                onNameChange={withErrorReset(setEditName, editNameError, setEditNameError)}
                onAddressChange={withErrorReset(setEditAddress, editAddressError, setEditAddressError)}
                onLatitudeChange={withErrorReset(setEditLatitude, editLatitudeError, setEditLatitudeError)}
                onLongitudeChange={withErrorReset(setEditLongitude, editLongitudeError, setEditLongitudeError)}
            />
        </>
    );
};

export default BuildingsLayout;
