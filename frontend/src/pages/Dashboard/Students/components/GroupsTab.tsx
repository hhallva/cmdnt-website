import React, { useCallback, useMemo, useState } from 'react';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonTable, { type ColumnDefinition, type RowActionConfig } from '../../../../components/CommonTable/CommonTable';
import { apiClient } from '../../../../api/client';
import type { GroupDto } from '../../../../types/groups';
import { groupQueryKeys, useGroupsQuery } from '../../../../hooks/useGroupsQuery.ts';
import GroupModal from '../../components/GroupModal'; // создадим отдельный модальный компонент (см. ниже)
import styles from '../../Furniche/Furniche.module.css';
import { queryClient } from '../../../../queryClient.ts';

const columns: ColumnDefinition<GroupDto>[] = [
    {
        key: 'name',
        title: 'Название',
        sortable: true,
        render: (item) => item.name || '—',
    },
    {
        key: 'course',
        title: 'Курс',
        sortable: true,
        render: (item) => item.course ?? '—',
    },
];


type GroupsTabProps = {
    searchTerm: string;
    onExportReady?: (handler: (() => void) | null) => void;
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
};

const GroupsTab: React.FC<GroupsTabProps> = ({ searchTerm }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCourse, setNewCourse] = useState<number | ''>('');
    const [nameError, setNameError] = useState<string | null>(null);
    const [courseError, setCourseError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<GroupDto | null>(null);
    const [editName, setEditName] = useState('');
    const [editCourse, setEditCourse] = useState<number | ''>('');
    const [editNameError, setEditNameError] = useState<string | null>(null);
    const [editCourseError, setEditCourseError] = useState<string | null>(null);
    const [isEditSaving, setIsEditSaving] = useState(false);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'name',
        direction: 'asc',
    });

    const { data: groups = [], isLoading: loading, error: queryError } = useGroupsQuery();
    const error = queryError ? getErrorMessage(queryError, 'Не удалось загрузить группы') : null;

    const refreshGroups = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['groups'] });
    }, [groupQueryKeys]);

    // Фильтрация по поиску
    const filteredGroups = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return groups;
        return groups.filter(g => g.name.toLowerCase().includes(term));
    }, [searchTerm, groups]);

    // Сортировка
    const requestSort = useCallback((key: string) => {
        setSortConfig(prev => {
            if (prev && prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    }, []);

    const sortedGroups = useMemo(() => {
        const result = [...filteredGroups];
        if (!sortConfig) return result;

        const { key, direction } = sortConfig;
        const multiplier = direction === 'asc' ? 1 : -1;

        result.sort((a, b) => {
            if (key === 'name') {
                return a.name.localeCompare(b.name) * multiplier;
            }
            if (key === 'course') {
                return (a.course - b.course) * multiplier;
            }
            return 0;
        });

        return result;
    }, [filteredGroups, sortConfig]);

    // --- Добавление ---
    const openAddModal = () => {
        setNewName('');
        setNewCourse('');
        setNameError(null);
        setCourseError(null);
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        if (!isSaving) setIsAddModalOpen(false);
    };

    const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = newName.trim();
        if (!trimmedName) {
            setNameError('Введите название');
            return;
        }
        if (newCourse === '' || newCourse <= 0) {
            setCourseError('Введите корректный курс (число > 0)');
            return;
        }

        setIsSaving(true);
        setNameError(null);
        setCourseError(null);
        try {
            await apiClient.createGroup({ name: trimmedName, course: newCourse });
            setIsAddModalOpen(false);
            setNewName('');
            setNewCourse('');
            await refreshGroups();
        } catch (err: any) {
            setNameError(err?.message || 'Не удалось создать группу');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Редактирование ---
    const openEditModal = useCallback((group: GroupDto) => {
        setEditTarget(group);
        setEditName(group.name);
        setEditCourse(group.course);
        setEditNameError(null);
        setEditCourseError(null);
        setIsEditModalOpen(true);
    }, []);

    const closeEditModal = useCallback(() => {
        if (!isEditSaving) {
            setIsEditModalOpen(false);
            setEditTarget(null);
        }
    }, [isEditSaving]);

    const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editTarget) return;

        const trimmedName = editName.trim();
        if (!trimmedName) {
            setEditNameError('Введите название');
            return;
        }
        if (editCourse === '' || editCourse <= 0) {
            setEditCourseError('Введите корректный курс');
            return;
        }

        setIsEditSaving(true);
        setEditNameError(null);
        setEditCourseError(null);
        try {
            await apiClient.updateGroup(editTarget.id, { name: trimmedName, course: editCourse });
            setIsEditModalOpen(false);
            setEditTarget(null);
            await refreshGroups();
        } catch (err: any) {
            setEditNameError(err?.message || 'Не удалось обновить группу');
        } finally {
            setIsEditSaving(false);
        }
    };

    // --- Удаление ---
    const handleDeleteGroup = useCallback(async (group: GroupDto) => {
        if (!window.confirm(`Удалить группу "${group.name}"? Это действие необратимо.`)) {
            return;
        }
        try {
            await apiClient.deleteGroup(group.id);
            await refreshGroups();
        } catch (err: any) {
            alert(err?.message || 'Не удалось удалить группу');
        }
    }, [refreshGroups]);

    // Действия над строкой
    const rowAction = useMemo<RowActionConfig<GroupDto>>(() => ({
        icon: 'bi-three-dots-vertical',
        title: 'Действия',
        popupActions: [
            {
                label: 'Редактировать',
                icon: 'bi-pencil',
                onClick: openEditModal,
            },
            {
                label: 'Удалить',
                icon: 'bi-trash',
                variant: 'danger',
                onClick: handleDeleteGroup,
            },
        ],
    }), [handleDeleteGroup, openEditModal]);

    // Рендер
    const content = useMemo(() => {
        if (loading) {
            return (
                <div className="d-flex justify-content-center align-items-center my-3">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </div>
                </div>
            );
        }

        if (error) {
            return <div className="alert alert-danger m-3">{error}</div>;
        }

        return (
            <div className={styles.tableBlock}>
                <div className={styles.tableHeaderRow}>
                    <span className={styles.tableTotal}>
                        {searchTerm.trim()
                            ? `Всего: ${filteredGroups.length} из ${groups.length}`
                            : `Всего: ${groups.length}`}
                    </span>
                    <ActionButton
                        variant="light"
                        size="md"
                        className={styles.addButton}
                        onClick={openAddModal}
                    >
                        <div className={styles.addButtonContent}>
                            <i className="bi bi-plus"></i>
                            <span>Добавить группу</span>
                        </div>
                    </ActionButton>
                </div>

                {/* Модалка добавления */}
                <GroupModal
                    title="Новая группа"
                    isOpen={isAddModalOpen}
                    onClose={closeAddModal}
                    onSubmit={handleAddSubmit}
                    name={newName}
                    course={newCourse}
                    nameError={nameError}
                    courseError={courseError}
                    isSaving={isSaving}
                    onNameChange={(value) => {
                        setNewName(value);
                        if (nameError) setNameError(null);
                    }}
                    onCourseChange={(value) => {
                        setNewCourse(value);
                        if (courseError) setCourseError(null);
                    }}
                    submitLabel={isSaving ? 'Добавляем…' : 'Добавить'}
                />

                {/* Модалка редактирования */}
                <GroupModal
                    title="Редактировать группу"
                    isOpen={isEditModalOpen}
                    onClose={closeEditModal}
                    onSubmit={handleEditSubmit}
                    name={editName}
                    course={editCourse}
                    nameError={editNameError}
                    courseError={editCourseError}
                    isSaving={isEditSaving}
                    onNameChange={(value) => {
                        setEditName(value);
                        if (editNameError) setEditNameError(null);
                    }}
                    onCourseChange={(value) => {
                        setEditCourse(value);
                        if (editCourseError) setEditCourseError(null);
                    }}
                    submitLabel={isEditSaving ? 'Сохраняем…' : 'Сохранить'}
                />

                <CommonTable
                    data={sortedGroups}
                    columns={columns}
                    rowAction={rowAction}
                    enableSorting
                    onSortRequest={requestSort}
                    sortConfig={sortConfig}
                    emptyMessage="Группы не найдены"
                />
            </div>
        );
    }, [
        loading,
        error,
        searchTerm,
        filteredGroups,
        groups.length,
        openAddModal,
        isAddModalOpen,
        closeAddModal,
        handleAddSubmit,
        newName,
        newCourse,
        nameError,
        courseError,
        isSaving,
        isEditModalOpen,
        closeEditModal,
        handleEditSubmit,
        editName,
        editCourse,
        editNameError,
        editCourseError,
        isEditSaving,
        sortedGroups,
        rowAction,
        requestSort,
        sortConfig,
    ]);

    return content;
};

export default GroupsTab;