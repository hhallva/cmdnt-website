import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import type { GroupDto } from '../../../../types/groups';
import type { PostStudentDto } from '../../../../types/students';

import { apiClient } from '../../../../api/client';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonTable from '../../../../components/CommonTable/CommonTable';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import {
    ALLOWED_IMPORT_EXTENSIONS,
    IMPORT_EXPECTED_HEADERS,
    MAX_IMPORT_FILE_SIZE,
} from '../constants';
import {
    formatDateForApi,
    isPhoneValid,
    mapGenderFromText,
    sanitizePhone,
    splitFullName,
} from '../../../../utils/students';

import styles from '../Students.module.css';

interface ImportStudentsTabProps {
    groups: GroupDto[];
    onImportComplete: () => Promise<void> | void;
}

type ImportRowField = 'fullName' | 'groupName' | 'course' | 'gender' | 'origin' | 'phone' | 'birthday';

type ImportRow = {
    rowIndex: number;
    fullName: string;
    groupName: string;
    course: string;
    gender: string;
    origin: string;
    phone: string;
    birthday: string;
};

type ImportRowErrors = Record<number, Partial<Record<ImportRowField, true>>>;

const normalizeBirthdayFormat = (value: string) => {
    const trimmed = value.trim();
    const numericValue = Number(trimmed);
    if (!Number.isNaN(numericValue) && numericValue > 20000) {
        const parsed = XLSX.SSF.parse_date_code(numericValue);
        if (parsed) {
            const day = `${parsed.d}`.padStart(2, '0');
            const month = `${parsed.m}`.padStart(2, '0');
            return `${day}.${month}.${parsed.y}`;
        }
    }
    const normalized = trimmed.replace(/[/-]/g, '.');
    const shortMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(normalized);
    if (!shortMatch) {
        return normalized;
    }
    const [, dayRaw, monthRaw, yearRaw] = shortMatch;
    const day = dayRaw.padStart(2, '0');
    const month = monthRaw.padStart(2, '0');
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    return `${day}.${month}.${year}`;
};

const isValidBirthday = (value: string) => {
    const normalized = normalizeBirthdayFormat(value);
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(normalized);
    if (!match) {
        return false;
    }
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
        return false;
    }
    if (month < 1 || month > 12) {
        return false;
    }
    const maxDays = new Date(year, month, 0).getDate();
    return day >= 1 && day <= maxDays;
};

const ImportStudentsTab: React.FC<ImportStudentsTabProps> = ({ groups, onImportComplete }) => {
    const [importDragActive, setImportDragActive] = useState(false);
    const [importFileName, setImportFileName] = useState('');
    const [importRows, setImportRows] = useState<ImportRow[]>([]);
    const [rowErrors, setRowErrors] = useState<ImportRowErrors>({});
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [infoModal, setInfoModal] = useState<{ title: string; tips: string[] } | null>(null);
    const [importToast, setImportToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!importToast) {
            return undefined;
        }
        const timerId = window.setTimeout(() => {
            setImportToast(null);
        }, 3500);
        return () => window.clearTimeout(timerId);
    }, [importToast]);

    const getCellValue = useCallback((value?: string | null) => (value?.trim() ? value : '—'), []);

    const renderPreviewCell = useCallback((field: ImportRowField, value: string, rowIndex: number) => {
        const hasError = Boolean(rowErrors[rowIndex]?.[field]);
        return (
            <span className={hasError ? styles.importCellError : undefined}>
                {getCellValue(value)}
            </span>
        );
    }, [getCellValue, rowErrors]);

    const importFieldTips: Record<ImportRowField, { title: string; tips: string[] }> = useMemo(() => ({
        fullName: {
            title: 'ФИО',
            tips: [
                'Три части: Фамилия Имя Отчество через пробел.',
                'Имя и фамилия обязательны, до 100 символов.',
            ],
        },
        groupName: {
            title: 'Группа',
            tips: [
                'Должна совпадать с названием группы в системе.',
                'Проверьте список на листе "Группы" в шаблоне.',
            ],
        },
        gender: {
            title: 'Пол',
            tips: [
                'Только значения М или Ж.',
            ],
        },
        origin: {
            title: 'Населенный пункт',
            tips: [
                'Не более 300 символов.',
                'Можно оставить пустым.',
            ],
        },
        phone: {
            title: 'Телефон',
            tips: [
                'Формат +7XXXXXXXXXX.',
                'Можно оставить пустым.',
            ],
        },
        birthday: {
            title: 'Дата рождения',
            tips: [
                'Формат: дд.мм.гггг или гггг-мм-дд.',
                'Можно использовать Excel-дату.',
            ],
        },
        course: {
            title: 'Курс',
            tips: [
                'Колонка не используется при импорте.',
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
        { key: 'fullName', title: renderHeaderWithInfo('fullName', 'ФИО'), render: (row: ImportRow) => renderPreviewCell('fullName', row.fullName, row.rowIndex) },
        { key: 'groupName', title: renderHeaderWithInfo('groupName', 'Группа'), render: (row: ImportRow) => renderPreviewCell('groupName', row.groupName, row.rowIndex) },
        { key: 'gender', title: renderHeaderWithInfo('gender', 'Пол'), render: (row: ImportRow) => renderPreviewCell('gender', row.gender, row.rowIndex) },
        { key: 'origin', title: renderHeaderWithInfo('origin', 'Населенный пункт'), render: (row: ImportRow) => renderPreviewCell('origin', row.origin, row.rowIndex) },
        { key: 'phone', title: renderHeaderWithInfo('phone', 'Телефон'), render: (row: ImportRow) => renderPreviewCell('phone', row.phone, row.rowIndex) },
        { key: 'birthday', title: renderHeaderWithInfo('birthday', 'Дата рождения'), render: (row: ImportRow) => renderPreviewCell('birthday', row.birthday, row.rowIndex) },
    ]), [renderHeaderWithInfo, renderPreviewCell]);

    const validateRows = useCallback((rows: ImportRow[]) => {
        const errorsByRow: ImportRowErrors = {};
        const failedDetails: Array<{ row: number; fullName: string; reason: string }> = [];

        rows.forEach(row => {
            const rowIssues: ImportRowErrors[number] = {};
            const { surname, name, patronymic } = splitFullName(row.fullName);

            if (!surname || !name) {
                rowIssues.fullName = true;
            }
            if (surname && surname.length > 100) rowIssues.fullName = true;
            if (name && name.length > 100) rowIssues.fullName = true;
            if (patronymic && patronymic.length > 100) rowIssues.fullName = true;

            const normalizedGroupName = row.groupName.trim().toLowerCase();
            const matchedGroup = groups.find(group => {
                if (!group.name) {
                    return false;
                }
                const nameMatch = group.name.trim().toLowerCase() === normalizedGroupName;
                return nameMatch;
            });

            if (!normalizedGroupName || !matchedGroup) {
                rowIssues.groupName = true;
            }


            const birthdayRaw = row.birthday.trim();
            const birthdayNormalized = normalizeBirthdayFormat(birthdayRaw);
            const birthdayIso = isValidBirthday(birthdayNormalized) ? formatDateForApi(birthdayNormalized) : null;
            if (!birthdayIso) {
                rowIssues.birthday = true;
            }

            const genderRaw = row.gender.trim();
            const genderNormalized = genderRaw.toLowerCase();
            const isGenderValid = genderNormalized === 'м' || genderNormalized === 'ж';
            if (!isGenderValid) {
                rowIssues.gender = true;
            }

            const normalizedOrigin = row.origin?.trim() ?? '';
            if (normalizedOrigin && normalizedOrigin.length > 300) {
                rowIssues.origin = true;
            }

            const sanitizedPhone = sanitizePhone(row.phone);
            const hasPhone = Boolean(row.phone?.trim());
            if (hasPhone && !isPhoneValid(sanitizedPhone)) {
                rowIssues.phone = true;
            }

            const issueKeys = Object.keys(rowIssues) as ImportRowField[];
            if (issueKeys.length > 0) {
                errorsByRow[row.rowIndex] = rowIssues;
                const shortLabels: Partial<Record<ImportRowField, string>> = {
                    fullName: 'ФИО',
                    groupName: 'группа',
                    gender: 'пол',
                    origin: 'место',
                    phone: 'телефон',
                    birthday: 'дата',
                };
                const reason = issueKeys.map(key => shortLabels[key]).filter(Boolean).join(', ');
                failedDetails.push({
                    row: row.rowIndex + 2,
                    fullName: row.fullName || 'Без ФИО',
                    reason: reason ? `Ошибка: ${reason}` : 'Ошибка данных',
                });
            }
        });

        return { errorsByRow, failedDetails };
    }, [groups]);


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
                const birthdayValue = normalizeBirthdayFormat(getValue('Дата рождения'));
                return {
                    rowIndex: 0,
                    fullName: getValue('ФИО'),
                    groupName: getValue('Группа'),
                    course: getValue('Курс'),
                    gender: getValue('Пол'),
                    origin: getValue('Населенный пункт'),
                    phone: getValue('Телефон'),
                    birthday: birthdayValue,
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
        let successCount = 0;
        for (const row of rowsToImport) {
            const { surname, name, patronymic } = splitFullName(row.fullName);
            const normalizedGroupName = row.groupName.trim().toLowerCase();
            const matchedGroup = groups.find(group => {
                if (!group.name) {
                    return false;
                }
                return group.name.trim().toLowerCase() === normalizedGroupName;
            });
            const birthdayRaw = row.birthday.trim();
            const birthdayNormalized = normalizeBirthdayFormat(birthdayRaw);
            const birthdayIso = isValidBirthday(birthdayNormalized) ? formatDateForApi(birthdayNormalized) : null;
            const genderValue = mapGenderFromText(row.gender);
            const normalizedOrigin = row.origin?.trim() ?? '';
            const sanitizedPhone = sanitizePhone(row.phone);
            if (!matchedGroup || !birthdayIso || genderValue === null) {
                continue;
            }
            const payload: PostStudentDto = {
                surname,
                name,
                patronymic: patronymic || '',
                birthday: birthdayIso,
                groupId: matchedGroup.id,
                gender: genderValue,
                origin: normalizedOrigin ? normalizedOrigin : null,
                phone: sanitizedPhone,
            };
            try {
                await apiClient.createStudent(payload);
                successCount++;
            } catch (err) {
                console.error('Ошибка при импорте студента:', err);
            }
        }
        await onImportComplete?.();
        setImportToast({
            type: 'success',
            message: `Успешно импортировано ${successCount}`,
        });
        setIsImporting(false);
        setImportRows([]);
        setImportFileName('');
        setRowErrors({});
    }, [importRows, groups, onImportComplete, validateRows]);

    const handleDownloadTemplate = useCallback(() => {
        const templateSheet = XLSX.utils.aoa_to_sheet([
            IMPORT_EXPECTED_HEADERS,
            ['Иванов Иван Иванович', 'ИС-21', 'М', 'г. Пермь', '+7XXXXXXXXXX', '12.08.2002'],
        ]);

        const groupsSheetData = [
            ['Группа', 'Курс'],
            ...groups
                .slice()
                .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'))
                .map(group => [group.name ?? '', group.course ?? '']),
        ];
        const groupsSheet = XLSX.utils.aoa_to_sheet(groupsSheetData);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, templateSheet, 'Шаблон');
        XLSX.utils.book_append_sheet(workbook, groupsSheet, 'Группы');
        XLSX.writeFile(workbook, 'Шаблон_импорта_студентов.xlsx');
    }, [groups]);

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

export default ImportStudentsTab;
