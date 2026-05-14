import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import type { StationaryEquipmentDto, PostStationaryEquipmentDto } from '../../../../types/stationaryEquipment';
import type { StationaryTypeDto } from '../../../../types/stationaryTypes';
import type { StatusDto } from '../../../../types/statuses';

import { apiClient } from '../../../../api/client';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonTable from '../../../../components/CommonTable/CommonTable';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import {
    ALLOWED_IMPORT_EXTENSIONS,
    IMPORT_EXPECTED_HEADERS,
    MAX_IMPORT_FILE_SIZE,
} from '../constants';

import styles from '../../Students/Students.module.css';

type ImportRowField = 'inventoryNumber' | 'typeName' | 'statusName' | 'description';

type ImportRow = {
    rowIndex: number;
    inventoryNumber: string;
    typeName: string;
    statusName: string;
    description: string;
};

type ImportRowErrors = Record<number, Partial<Record<ImportRowField, true>>>;

const normalizeText = (value: string) => value.trim().toLowerCase();
const normalizeInventory = (value: string) => value.trim().toUpperCase();
const inventoryPattern = /^[A-Z0-9]{6}$/;

interface FurnicheImportTabProps {
    onImportComplete?: () => Promise<void> | void;
}

const FurnicheImportTab: React.FC<FurnicheImportTabProps> = ({ onImportComplete }) => {
    const [importDragActive, setImportDragActive] = useState(false);
    const [importFileName, setImportFileName] = useState('');
    const [importRows, setImportRows] = useState<ImportRow[]>([]);
    const [rowErrors, setRowErrors] = useState<ImportRowErrors>({});
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [infoModal, setInfoModal] = useState<{ title: string; tips: string[] } | null>(null);
    const [importToast, setImportToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [types, setTypes] = useState<StationaryTypeDto[]>([]);
    const [statuses, setStatuses] = useState<StatusDto[]>([]);
    const [equipment, setEquipment] = useState<StationaryEquipmentDto[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const loadReferenceData = async () => {
            try {
                const [typesData, statusesData, equipmentData] = await Promise.all([
                    apiClient.getStationaryTypes(),
                    apiClient.getStatuses(),
                    apiClient.getStationaryEquipment(),
                ]);
                setTypes(typesData);
                setStatuses(statusesData);
                setEquipment(equipmentData);
            } catch (err: any) {
                setImportError(err?.message || 'Не удалось загрузить справочники');
            }
        };

        void loadReferenceData();
    }, []);

    useEffect(() => {
        if (!importToast) {
            return undefined;
        }
        const timerId = window.setTimeout(() => {
            setImportToast(null);
        }, 3500);
        return () => window.clearTimeout(timerId);
    }, [importToast]);

    const getCellValue = useCallback((value?: string | null) => (value?.trim() ? value : 'нет'), []);

    const renderPreviewCell = useCallback((field: ImportRowField, value: string, rowIndex: number) => {
        const hasError = Boolean(rowErrors[rowIndex]?.[field]);
        return (
            <span className={hasError ? styles.importCellError : undefined}>
                {getCellValue(value)}
            </span>
        );
    }, [getCellValue, rowErrors]);

    const importFieldTips: Record<ImportRowField, { title: string; tips: string[] }> = useMemo(() => ({
        inventoryNumber: {
            title: 'Инвентарный номер',
            tips: [
                'Ровно 6 символов: английские буквы и цифры.',
                'Должен быть уникальным.',
            ],
        },
        typeName: {
            title: 'Категория',
            tips: [
                'Должна совпадать с названием категории в системе.',
                'Проверьте лист "Категории" в шаблоне.',
            ],
        },
        statusName: {
            title: 'Статус',
            tips: [
                'Должен совпадать с названием статуса в системе.',
                'Проверьте лист "Статусы" в шаблоне.',
            ],
        },
        description: {
            title: 'Описание',
            tips: [
                'Не более 300 символов.',
                'Можно оставить пустым.',
            ],
        },
    }), []);

    const renderHeaderWithInfo = useCallback((field: ImportRowField, label: string) => (
        <span className={styles.importHeaderWithInfo}>
            {label}
            <button
                type="button"
                className={styles.importInfoButton}
                aria-label={`Подсказка по полю ${label}`}
                onClick={() => setInfoModal(importFieldTips[field])}
            >
                <i className={`bi bi-info-circle ${styles.importInfoIcon}`}></i>
            </button>
        </span>
    ), [importFieldTips]);

    const importPreviewColumns = useMemo(() => ([
        { key: 'inventoryNumber', title: renderHeaderWithInfo('inventoryNumber', 'Инвентарный номер'), render: (row: ImportRow) => renderPreviewCell('inventoryNumber', row.inventoryNumber, row.rowIndex) },
        { key: 'typeName', title: renderHeaderWithInfo('typeName', 'Категория'), render: (row: ImportRow) => renderPreviewCell('typeName', row.typeName, row.rowIndex) },
        { key: 'statusName', title: renderHeaderWithInfo('statusName', 'Статус'), render: (row: ImportRow) => renderPreviewCell('statusName', row.statusName, row.rowIndex) },
        { key: 'description', title: renderHeaderWithInfo('description', 'Описание'), render: (row: ImportRow) => renderPreviewCell('description', row.description, row.rowIndex) },
    ]), [renderHeaderWithInfo, renderPreviewCell]);

    const validateRows = useCallback((rows: ImportRow[]) => {
        const errorsByRow: ImportRowErrors = {};
        const failedDetails: Array<{ row: number; inventoryNumber: string; reason: string }> = [];
        const knownTypes = new Set(types.map(type => normalizeText(type.name)));
        const knownStatuses = new Set(statuses.map(status => normalizeText(status.name)));
        const existingInventory = new Set(equipment.map(item => normalizeInventory(item.inventoryNumber)));
        const seenInventory = new Set<string>();

        rows.forEach(row => {
            const rowIssues: ImportRowErrors[number] = {};
            const inventoryNormalized = normalizeInventory(row.inventoryNumber);
            const typeNormalized = normalizeText(row.typeName);
            const statusNormalized = normalizeText(row.statusName);

            if (!inventoryPattern.test(inventoryNormalized)) {
                rowIssues.inventoryNumber = true;
            }

            if (inventoryNormalized && (seenInventory.has(inventoryNormalized) || existingInventory.has(inventoryNormalized))) {
                rowIssues.inventoryNumber = true;
            }

            if (!typeNormalized || !knownTypes.has(typeNormalized)) {
                rowIssues.typeName = true;
            }

            if (!statusNormalized || !knownStatuses.has(statusNormalized)) {
                rowIssues.statusName = true;
            }

            if (row.description && row.description.length > 300) {
                rowIssues.description = true;
            }

            if (!rowIssues.inventoryNumber && inventoryNormalized) {
                seenInventory.add(inventoryNormalized);
            }

            const issueKeys = Object.keys(rowIssues) as ImportRowField[];
            if (issueKeys.length > 0) {
                errorsByRow[row.rowIndex] = rowIssues;
                const shortLabels: Partial<Record<ImportRowField, string>> = {
                    inventoryNumber: 'инв. номер',
                    typeName: 'категория',
                    statusName: 'статус',
                    description: 'описание',
                };
                const reason = issueKeys.map(key => shortLabels[key]).filter(Boolean).join(', ');
                failedDetails.push({
                    row: row.rowIndex + 2,
                    inventoryNumber: row.inventoryNumber || 'Без номера',
                    reason: reason ? `Ошибка: ${reason}` : 'Ошибка данных',
                });
            }
        });

        return { errorsByRow, failedDetails };
    }, [equipment, statuses, types]);

    const handleImportCancel = useCallback(() => {
        setImportRows([]);
        setImportFileName('');
        setImportError(null);
        setRowErrors({});
        setImportDragActive(false);
        setIsImporting(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleImportFile = useCallback(async (file: File | null) => {
        if (!file) {
            return;
        }
        if (file.size > MAX_IMPORT_FILE_SIZE) {
            setImportError('Файл превышает максимальный размер 200 МБ');
            setImportRows([]);
            setImportFileName('');
            return;
        }
        const extension = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
        if (!ALLOWED_IMPORT_EXTENSIONS.includes(extension)) {
            setImportError('Допустимы только файлы форматов .xls или .xlsx');
            setImportRows([]);
            setImportFileName('');
            return;
        }
        try {
            setImportError(null);
            setImportRows([]);
            setImportFileName(file.name);
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
                throw new Error('Файл не содержит листов');
            }
            const worksheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
                header: 1,
                raw: false,
                blankrows: false,
            }).filter(row => Array.isArray(row) && row.some(cell => (cell ?? '').toString().trim() !== ''));
            if (!rawRows.length) {
                throw new Error('Файл не содержит данных');
            }
            const headerRow = rawRows[0].map(cell => cell?.toString().trim().toLowerCase() ?? '');
            const headerMap: Record<string, number> = {};
            const missingHeaders: string[] = [];
            IMPORT_EXPECTED_HEADERS.forEach(header => {
                const index = headerRow.indexOf(header.toLowerCase());
                if (index === -1) {
                    missingHeaders.push(header);
                } else {
                    headerMap[header] = index;
                }
            });
            if (missingHeaders.length) {
                throw new Error(`Отсутствуют столбцы: ${missingHeaders.join(', ')}`);
            }
            const parsedRows = rawRows.slice(1).map(row => {
                const getValue = (header: string) => {
                    const idx = headerMap[header];
                    return idx !== undefined ? (row[idx] ?? '').toString().trim() : '';
                };
                return {
                    rowIndex: 0,
                    inventoryNumber: getValue('Инвентарный номер'),
                    typeName: getValue('Категория'),
                    statusName: getValue('Статус'),
                    description: getValue('Описание'),
                };
            }).map((row, index) => ({ ...row, rowIndex: index }));
            if (!parsedRows.length) {
                throw new Error('Не найдено строк с данными для импорта');
            }
            const validation = validateRows(parsedRows);
            setRowErrors(validation.errorsByRow);
            setImportRows(parsedRows);
        } catch (err: any) {
            console.error('Ошибка обработки файла импорта:', err);
            setImportRows([]);
            setImportFileName('');
            setImportError(err?.message || 'Не удалось обработать файл');
            setRowErrors({});
        }
    }, [validateRows]);

    const handleImportSubmit = useCallback(async () => {
        if (!importRows.length) {
            setImportError('Сначала загрузите файл с данными');
            return;
        }
        setIsImporting(true);
        setImportError(null);
        const validation = validateRows(importRows);
        setRowErrors(validation.errorsByRow);
        const rowsToImport = importRows.filter(row => !validation.errorsByRow[row.rowIndex]);
        if (validation.failedDetails.length) {
            const shouldProceed = window.confirm('В файле есть ошибки. Импортировать только корректные строки?');
            if (!shouldProceed) {
                setIsImporting(false);
                return;
            }
        }
        if (!rowsToImport.length) {
            setIsImporting(false);
            return;
        }

        const typeByName = new Map(types.map(type => [normalizeText(type.name), type]));
        const statusByName = new Map(statuses.map(status => [normalizeText(status.name), status]));

        let successCount = 0;
        for (const row of rowsToImport) {
            const inventoryNumber = normalizeInventory(row.inventoryNumber);
            const matchedType = typeByName.get(normalizeText(row.typeName));
            const matchedStatus = statusByName.get(normalizeText(row.statusName));
            const description = row.description?.trim() ?? '';
            if (!matchedType || !matchedStatus) {
                continue;
            }
            const payload: PostStationaryEquipmentDto = {
                inventoryNumber,
                typeId: matchedType.id,
                statusId: matchedStatus.id,
                description: description ? description : null,
            };
            try {
                await apiClient.createStationaryEquipment(payload);
                successCount++;
            } catch (err) {
                console.error('Ошибка при импорте мебели:', err);
            }
        }

        setImportToast({
            type: 'success',
            message: `Успешно импортировано ${successCount}`,
        });
        setIsImporting(false);
        setImportRows([]);
        setImportFileName('');
        setRowErrors({});
        const equipmentData = await apiClient.getStationaryEquipment();
        setEquipment(equipmentData);
        if (successCount > 0) {
            await onImportComplete?.();
        }
    }, [importRows, onImportComplete, statuses, types, validateRows]);

    const handleDownloadTemplate = useCallback(() => {
        const templateSheet = XLSX.utils.aoa_to_sheet([
            IMPORT_EXPECTED_HEADERS,
            ['A1B2C3', 'Кровать', 'Исправно', 'Новая партия'],
            ['A1B2C4', 'Стол', 'Исправно', 'Новая партия'],
        ]);

        const categoriesSheetData = [
            ['Категория'],
            ...types
                .slice()
                .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'))
                .map(type => [type.name ?? '']),
        ];
        const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesSheetData);

        const statusesSheetData = [
            ['Статус'],
            ...statuses
                .slice()
                .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'))
                .map(status => [status.name ?? '']),
        ];
        const statusesSheet = XLSX.utils.aoa_to_sheet(statusesSheetData);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, templateSheet, 'Шаблон');
        XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Категории');
        XLSX.utils.book_append_sheet(workbook, statusesSheet, 'Статусы');
        XLSX.writeFile(workbook, 'Шаблон_импорта_мебели.xlsx');
    }, [statuses, types]);

    const handleDropZoneClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleDropZoneDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setImportDragActive(true);
    }, []);

    const handleDropZoneDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setImportDragActive(false);
    }, []);

    const handleDropZoneDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setImportDragActive(false);
        const file = event.dataTransfer?.files?.[0];
        void handleImportFile(file ?? null);
    }, [handleImportFile]);

    const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        void handleImportFile(file);
        event.target.value = '';
    }, [handleImportFile]);

    const handleDropZoneKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleDropZoneClick();
        }
    }, [handleDropZoneClick]);

    const importToastMarkup = importToast && typeof document !== 'undefined'
        ? createPortal(
            <div className={styles.toastContainer}>
                <div className={`${styles.toast} ${importToast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                    <span>{importToast.message}</span>
                    <button
                        type="button"
                        className={styles.toastCloseButton}
                        onClick={() => setImportToast(null)}
                        aria-label="Закрыть уведомление"
                    >
                        ×
                    </button>
                </div>
            </div>,
            document.body
        )
        : null;

    return (
        <div className={styles.importTabWrapper} style={{ marginTop: '-0.75rem' }}>
            {importToastMarkup}
            <CommonModal
                title={infoModal?.title}
                isOpen={Boolean(infoModal)}
                onClose={() => setInfoModal(null)}
                minWidth={420}
            >
                <div className={styles.importInfoContent}>
                    <p className={styles.importInfoLead}>Возможные ошибки и решения:</p>
                    <ul className={styles.importInfoList}>
                        {infoModal?.tips.map((tip, index) => (
                            <li key={`${infoModal.title}-${index}`}>{tip}</li>
                        ))}
                    </ul>
                </div>
            </CommonModal>
            <section className={styles.importSection}>
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Загрузить файл импорта"
                    className={`${styles.importDropZone} ${importDragActive ? styles.importDropZoneActive : ''}`}
                    onClick={handleDropZoneClick}
                    onKeyDown={handleDropZoneKeyDown}
                    onDragOver={handleDropZoneDragOver}
                    onDragLeave={handleDropZoneDragLeave}
                    onDrop={handleDropZoneDrop}
                >
                    <i className={`bi bi-cloud-upload-fill ${styles.importDropIcon}`}></i>
                    <p className={styles.importDropHint}>
                        Перетащите файл или{' '}
                        <button
                            type="button"
                            className={styles.importChooseLink}
                            onClick={(event) => {
                                event.stopPropagation();
                                handleDropZoneClick();
                            }}
                        >
                            Выберите
                        </button>
                    </p>
                    <p className={styles.importDropNote}>Формат: xls, xlsx; Максимальный размер: 200 MB</p>
                    {importFileName && (
                        <p className={styles.importFileName}>Выбран файл: {importFileName}</p>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    className="visually-hidden"
                    onChange={handleFileInputChange}
                />
                {importError && (
                    <div className="alert alert-danger mt-3" role="alert">
                        {importError}
                    </div>
                )}
                <div className={styles.previewTableWrapper}>
                    <CommonTable
                        title="Предварительный просмотр"
                        data={importRows}
                        columns={importPreviewColumns}
                        className={styles.importPreviewTable}
                        emptyMessage="Данные не импортированы"
                    />
                </div>
            </section>
            <section className={styles.importSection}>
                <div className={styles.importActions}>
                    <ActionButton
                        variant="transparent-primary"
                        size="md"
                        onClick={handleDownloadTemplate}
                        className={`${styles.importTemplateButton} ${styles.fullWidthMobileButton}`}
                    >
                        <i className="bi bi-download me-2"></i>
                        Скачать шаблон
                    </ActionButton>
                    <div className={styles.importActionsRight}>
                        <ActionButton
                            variant="secondary"
                            size="md"
                            onClick={handleImportCancel}
                            disabled={isImporting}
                            className={styles.fullWidthMobileButton}
                        >
                            Отмена
                        </ActionButton>
                        <ActionButton
                            variant="primary"
                            size="md"
                            onClick={handleImportSubmit}
                            disabled={!importRows.length || isImporting}
                            className={styles.fullWidthMobileButton}
                        >
                            <i className="bi bi-upload me-2"></i>
                            Загрузить
                        </ActionButton>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FurnicheImportTab;
