import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonTable, { type ColumnDefinition, type RowActionConfig } from '../../../../components/CommonTable/CommonTable';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import InputField from '../../../../components/InputField/InputField';
import SelectField from '../../../../components/SelectField/SelectField';
import { apiClient } from '../../../../api/client';
import type { ExpendableDistributionDto, ExpendableDistributionUpsertDto } from '../../../../types/expendableDistribution';
import type { ExpendableEquipmentDto } from '../../../../types/expendableEquipment';
import type { StudentsDto } from '../../../../types/students';
import styles from '../Expendable.module.css';

type ExpendableDistributionRow = {
    id: number;
    studentName: string;
    pillow: number;
    mattress: number;
    blanket: number;
    pillowcase: number;
    sheet: number;
    duvetCover: number;
    plaid: number;
    recordMap: Partial<Record<DistributionItemKey, ExpendableDistributionDto>>;
};

type DistributionItemKey = 'pillow' | 'mattress' | 'blanket' | 'pillowcase' | 'sheet' | 'duvetCover' | 'plaid';
type SortableKey = 'studentName' | DistributionItemKey;

const distributionItems: Array<{ key: DistributionItemKey; label: string }> = [
    { key: 'mattress', label: 'Матрас' },
    { key: 'sheet', label: 'Простынь' },
    { key: 'blanket', label: 'Одеяло' },
    { key: 'duvetCover', label: 'Пододеяльник' },
    { key: 'pillow', label: 'Подушка' },
    { key: 'pillowcase', label: 'Наволочка' },
    { key: 'plaid', label: 'Плед' },
];

const columns: ColumnDefinition<ExpendableDistributionRow>[] = [
    { key: 'studentName', title: 'Студент', sortable: true, render: (item) => item.studentName || '—' },
    { key: 'mattress', title: 'Матрас', sortable: true, render: (item) => item.mattress },
    { key: 'sheet', title: 'Простынь', sortable: true, render: (item) => item.sheet },
    { key: 'blanket', title: 'Одеяло', sortable: true, render: (item) => item.blanket },
    { key: 'duvetCover', title: 'Пододеяльник', sortable: true, render: (item) => item.duvetCover },
    { key: 'pillow', title: 'Подушка', sortable: true, render: (item) => item.pillow },
    { key: 'pillowcase', title: 'Наволочка', sortable: true, render: (item) => item.pillowcase },
    { key: 'plaid', title: 'Плед', sortable: true, render: (item) => item.plaid },
];

type ExpendableDistributionTabProps = {
    searchTerm: string;
    onExportReady?: (handler: (() => void) | null) => void;
    resetSignal?: number;
};

const ExpendableDistributionTab: React.FC<ExpendableDistributionTabProps> = ({
    searchTerm,
    onExportReady,
    resetSignal,
}) => {
    const [distributions, setDistributions] = useState<ExpendableDistributionDto[]>([]);
    const [students, setStudents] = useState<StudentsDto[]>([]);
    const [stock, setStock] = useState<ExpendableEquipmentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<ExpendableDistributionRow | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [fieldValues, setFieldValues] = useState<Record<DistributionItemKey, string>>({
        pillow: '',
        mattress: '',
        blanket: '',
        pillowcase: '',
        sheet: '',
        duvetCover: '',
        plaid: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<DistributionItemKey, string>>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>({
        key: 'studentName',
        direction: 'asc',
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [studentsData, stockData, distributionData] = await Promise.all([
                apiClient.getAllStudents(),
                apiClient.getExpendableEquipment(),
                apiClient.getExpendableDistributions(),
            ]);
            setStudents(studentsData);
            setStock(stockData);
            setDistributions(distributionData);
        } catch (err: any) {
            setError(err?.message || 'Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (resetSignal !== undefined) {
            setSortConfig({ key: 'studentName', direction: 'asc' });
        }
    }, [resetSignal]);

    const normalize = useCallback((value: string) => value.trim().toLowerCase(), []);

    const stockByName = useMemo(() => {
        const map = new Map<string, ExpendableEquipmentDto>();
        stock.forEach(item => {
            map.set(normalize(item.typeName), item);
        });
        return map;
    }, [normalize, stock]);

    const getStockForLabel = useCallback((label: string) => stockByName.get(normalize(label)), [normalize, stockByName]);

    const keyByTypeName = useMemo(() => {
        const map = new Map<string, DistributionItemKey>();
        distributionItems.forEach(item => {
            map.set(normalize(item.label), item.key);
        });
        return map;
    }, [normalize]);

    const rows = useMemo(() => {
        const map = new Map<number, ExpendableDistributionRow>();
        distributions.forEach(item => {
            const key = keyByTypeName.get(normalize(item.typeName));
            if (!key) {
                return;
            }

            const existing = map.get(item.studentId);
            const row = existing ?? {
                id: item.studentId,
                studentName: item.studentFullName || `Студент ${item.studentId}`,
                pillow: 0,
                mattress: 0,
                blanket: 0,
                pillowcase: 0,
                sheet: 0,
                duvetCover: 0,
                plaid: 0,
                recordMap: {},
            };

            row[key] = item.count;
            row.recordMap[key] = item;
            map.set(item.studentId, row);
        });

        return Array.from(map.values());
    }, [distributions, keyByTypeName, normalize]);

    const filteredRows = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        if (!normalized) {
            return rows;
        }
        return rows.filter(row => row.studentName.toLowerCase().includes(normalized));
    }, [rows, searchTerm]);

    const handleExport = useCallback(() => {
        const headerRow = ['Студент', 'Матрас', 'Простынь', 'Одеяло', 'Пододеяльник', 'Подушка', 'Наволочка', 'Плед'];
        const bodyRows = filteredRows.map(item => ([
            item.studentName,
            item.mattress,
            item.sheet,
            item.blanket,
            item.duvetCover,
            item.pillow,
            item.pillowcase,
            item.plaid,
        ]));

        const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Распределение');
        XLSX.writeFile(workbook, `Распределение_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }, [filteredRows]);

    const requestSort = useCallback((key: string) => {
        const allowedKeys: SortableKey[] = [
            'studentName',
            'mattress',
            'sheet',
            'blanket',
            'duvetCover',
            'pillow',
            'pillowcase',
            'plaid',
        ];
        if (!allowedKeys.includes(key as SortableKey)) {
            return;
        }
        setSortConfig(prevConfig => {
            if (prevConfig && prevConfig.key === key) {
                return {
                    key: key as SortableKey,
                    direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return { key: key as SortableKey, direction: 'asc' };
        });
    }, []);

    const sortedRows = useMemo(() => {
        const result = [...filteredRows];
        if (!sortConfig) {
            return result;
        }
        const { key, direction } = sortConfig;
        const multiplier = direction === 'asc' ? -1 : 1;

        result.sort((a, b) => {
            if (key === 'studentName') {
                const compare = a.studentName.localeCompare(b.studentName, 'ru', { sensitivity: 'base' });
                return direction === 'asc' ? compare : -compare;
            }

            return (a[key] - b[key]) * multiplier;
        });

        return result;
    }, [filteredRows, sortConfig]);

    useEffect(() => {
        onExportReady?.(() => handleExport);
        return () => {
            onExportReady?.(null);
        };
    }, [handleExport, onExportReady]);

    const studentOptions = useMemo(() => [
        { value: '', label: 'Выберите студента' },
        ...students.map(student => {
            const fullName = [student.surname, student.name, student.patronymic].filter(Boolean).join(' ');
            return { value: String(student.id), label: fullName || `Студент ${student.id}` };
        }),
    ], [students]);

    const openAddModal = useCallback(() => {
        setEditingRow(null);
        setSelectedStudentId('');
        setFieldValues({
            pillow: '',
            mattress: '',
            blanket: '',
            pillowcase: '',
            sheet: '',
            duvetCover: '',
            plaid: '',
        });
        setFieldErrors({});
        setFormError(null);
        setIsAddModalOpen(true);
    }, []);

    const openEditModal = useCallback((row: ExpendableDistributionRow) => {
        setEditingRow(row);
        setSelectedStudentId(String(row.id));
        setFieldValues({
            pillow: row.pillow ? String(row.pillow) : '',
            mattress: row.mattress ? String(row.mattress) : '',
            blanket: row.blanket ? String(row.blanket) : '',
            pillowcase: row.pillowcase ? String(row.pillowcase) : '',
            sheet: row.sheet ? String(row.sheet) : '',
            duvetCover: row.duvetCover ? String(row.duvetCover) : '',
            plaid: row.plaid ? String(row.plaid) : '',
        });
        setFieldErrors({});
        setFormError(null);
        setIsAddModalOpen(true);
    }, []);

    const closeAddModal = useCallback(() => {
        if (!isSaving) {
            setIsAddModalOpen(false);
        }
    }, [isSaving]);

    const handleValueChange = useCallback((key: DistributionItemKey, value: string) => {
        setFieldValues(prev => ({ ...prev, [key]: value }));
        setFieldErrors(prev => ({ ...prev, [key]: '' }));
        setFormError(null);
    }, []);

    const validateForm = useCallback(() => {
        const nextErrors: Partial<Record<DistributionItemKey, string>> = {};
        if (!selectedStudentId) {
            setFormError('Выберите студента');
        }

        distributionItems.forEach(item => {
            const rawValue = fieldValues[item.key];
            if (!rawValue) {
                return;
            }
            const parsed = Number.parseInt(rawValue, 10);
            if (Number.isNaN(parsed) || parsed < 0) {
                nextErrors[item.key] = 'Введите корректное число';
                return;
            }
            const stockInfo = getStockForLabel(item.label);
            const available = stockInfo?.inStockCount ?? 0;
            const currentCount = editingRow?.[item.key] ?? 0;
            const maxAllowed = available + currentCount;
            if (parsed > maxAllowed) {
                nextErrors[item.key] = 'Превышает остаток на складе';
            }
        });

        setFieldErrors(nextErrors);
        return Object.keys(nextErrors).length === 0 && Boolean(selectedStudentId);
    }, [editingRow, fieldValues, getStockForLabel, selectedStudentId]);

    const buildPayload = useCallback((studentId: number, typeId: number, count: number): ExpendableDistributionUpsertDto => ({
        studentId,
        typeId,
        count,
    }), []);

    const handleAddSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }
        const studentId = Number(selectedStudentId);
        if (!studentId) {
            setFormError('Выберите студента');
            return;
        }

        setIsSaving(true);
        setFormError(null);

        try {
            const operations: Array<Promise<unknown>> = [];
            let hasInvalidType = false;

            distributionItems.forEach(item => {
                const rawValue = fieldValues[item.key];
                const nextCount = rawValue ? Number.parseInt(rawValue, 10) : 0;
                const stockInfo = getStockForLabel(item.label);
                const typeId = stockInfo?.typeId;
                const existing = editingRow?.recordMap[item.key];

                if (!typeId && nextCount > 0) {
                    setFormError(`Категория "${item.label}" не найдена на складе`);
                    hasInvalidType = true;
                    return;
                }

                if (existing) {
                    if (nextCount === 0) {
                        operations.push(apiClient.deleteExpendableDistribution(existing.id));
                    } else if (nextCount !== existing.count || existing.studentId !== studentId || existing.typeId !== typeId) {
                        operations.push(apiClient.updateExpendableDistribution(existing.id, buildPayload(studentId, typeId!, nextCount)));
                    }
                } else if (nextCount > 0 && typeId) {
                    operations.push(apiClient.createExpendableDistribution(buildPayload(studentId, typeId, nextCount)));
                }
            });

            if (hasInvalidType) {
                setIsSaving(false);
                return;
            }

            if (operations.length) {
                await Promise.all(operations);
            }

            setIsAddModalOpen(false);
            await loadData();
        } catch (err: any) {
            setFormError(err?.message || 'Не удалось сохранить распределение');
        } finally {
            setIsSaving(false);
        }
    }, [buildPayload, editingRow, fieldValues, getStockForLabel, loadData, selectedStudentId, validateForm]);

    const handleDeleteRow = useCallback(async (row: ExpendableDistributionRow) => {
        if (!window.confirm('Удалить распределение для студента?')) {
            return;
        }
        const operations = Object.values(row.recordMap)
            .filter((record): record is ExpendableDistributionDto => Boolean(record))
            .map(record => apiClient.deleteExpendableDistribution(record.id));

        if (!operations.length) {
            return;
        }

        try {
            await Promise.all(operations);
            await loadData();
        } catch (err: any) {
            setError(err?.message || 'Не удалось удалить распределение');
        }
    }, [loadData]);

    const rowAction = useMemo<RowActionConfig<ExpendableDistributionRow>>(() => ({
        icon: 'bi-three-dots-vertical',
        title: 'Действия',
        popupActions: [
            {
                label: 'Редактировать',
                icon: 'bi-pencil',
                onClick: (item) => openEditModal(item),
            },
            {
                label: 'Удалить',
                icon: 'bi-trash',
                variant: 'danger',
                onClick: (item) => void handleDeleteRow(item),
            },
        ],
    }), [handleDeleteRow, openEditModal]);

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

    const totalLabel = searchTerm.trim()
        ? `Всего: ${filteredRows.length} из ${rows.length}`
        : `Всего: ${rows.length}`;

    return (
        <div className={styles.tableBlock}>
            <div className={styles.tableHeaderRow}>
                <span className={styles.tableTotal}>{totalLabel}</span>
                <ActionButton
                    variant="light"
                    size="md"
                    className={styles.addButton}
                    onClick={openAddModal}
                >
                    <div className={styles.addButtonContent}>
                        <i className="bi bi-plus"></i>
                        <span>Добавить</span>
                    </div>
                </ActionButton>
            </div>

            <CommonTable
                data={sortedRows}
                columns={columns}
                rowAction={rowAction}
                emptyMessage="Распределений не найдено"
                enableSorting={true}
                onSortRequest={requestSort}
                sortConfig={sortConfig}
            />

            <CommonModal
                title={editingRow ? 'Редактировать распределение' : 'Добавить распределение'}
                isOpen={isAddModalOpen}
                onClose={closeAddModal}
                minWidth={640}
            >
                <form onSubmit={handleAddSubmit} className={styles.modalForm} noValidate>
                    <SelectField
                        label="Студент"
                        value={selectedStudentId}
                        onChange={(event) => {
                            setSelectedStudentId(event.target.value);
                            setFormError(null);
                        }}
                        options={studentOptions}
                        error={formError ?? undefined}
                        disabled={isSaving}
                    />

                    <div className={styles.modalGrid}>
                        {distributionItems.map(item => {
                            const stockInfo = getStockForLabel(item.label);
                            const available = stockInfo?.inStockCount ?? 0;
                            const currentCount = editingRow?.[item.key] ?? 0;
                            const maxAllowed = available + currentCount;
                            return (
                                <div key={item.key} className={styles.modalGridItem}>
                                    <InputField
                                        label={item.label}
                                        type="number"
                                        min={0}
                                        max={maxAllowed}
                                        step={1}
                                        value={fieldValues[item.key]}
                                        onChange={(event) => handleValueChange(item.key, event.target.value)}
                                        error={fieldErrors[item.key]}
                                        disabled={isSaving || maxAllowed === 0}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div className={styles.modalActions}>
                        <ActionButton size="md" variant="primary" type="submit" disabled={isSaving}>
                            {isSaving ? 'Сохраняем…' : 'Сохранить'}
                        </ActionButton>
                    </div>
                </form>
            </CommonModal>
        </div>
    );
};

export default ExpendableDistributionTab;
