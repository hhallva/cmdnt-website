import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import InputField from '../../../components/InputField/InputField';
import ActionButton from '../../../components/ActionButton/ActionButton';
import CommonModal from '../../../components/CommonModal/CommonModal';
import StatisticsCard from '../../../components/StatisticsCard/StatisticsCard';
import type { BuildingDto } from '../../../types/buildings';
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
    const [nameError, setNameError] = useState<string | null>(null);
    const [addressError, setAddressError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(ACTIVE_BUILDING_STORAGE_KEY);
        }

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

    const filteredTiles = useMemo(() => {
        return filteredBuildings.map((building, index) => (
            <article
                key={building.id}
                className={structureStyles.blockCard}
                onClick={() => handleOpenBuilding(building)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleOpenBuilding(building);
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
    }, [filteredBuildings, handleOpenBuilding]);

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

    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setNewBuildingName('');
        setNewBuildingAddress('');
        setNameError(null);
        setAddressError(null);
    };

    const handleAddSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const name = newBuildingName.trim();
        const address = newBuildingAddress.trim();
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

        if (hasError) {
            return;
        }

        setIsAdding(true);
        try {
            const created = await apiClient.createBuilding({
                name,
                address,
                coordinates: {
                    latitude: null,
                    longitude: null,
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
                        { value: summaryStats.totalBuildings, label: 'Всего зданий' },
                        { value: summaryStats.totalStudents, label: 'Всего студентов' },
                        { value: summaryStats.totalCapacity, label: 'Всего мест' },
                        { value: summaryStats.occupiedStudents, label: 'Заселено студентов' },
                    ]}
                />
            )}
            {searchBar}
            {listContent}
            {isAdmin && (
                <>
                    <div className={tabsStyles.tabsSurface} style={{ padding: '1.5rem', marginTop: '2.75rem', borderRadius: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <ActionButton size="md" variant="primary" onClick={handleOpenAddModal}>
                                <span className="me-2">+</span>
                                Добавить
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
        </>
    );
};

export default BuildingsLayout;
