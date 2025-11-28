import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import type { GroupDto } from '../../../../types/groups';
import type { PostStudentDto } from '../../../../types/students';

import { apiClient } from '../../../../api/client';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonTable from '../../../../components/CommonTable/CommonTable';
import {
    ALLOWED_IMPORT_EXTENSIONS,
    IMPORT_EXPECTED_HEADERS,
    MAX_IMPORT_FILE_SIZE,
} from '../constants';
import {
    formatDateForApi,
    mapGenderFromText,
    sanitizePhone,
    splitFullName,
} from '../../../../utils/students';

import styles from '../Students.module.css';

interface ImportStudentsTabProps {
    groups: GroupDto[];
    onImportComplete: () => Promise<void> | void;
}

const ImportStudentsTab: React.FC<ImportStudentsTabProps> = ({ groups, onImportComplete }) => {
    const [importDragActive, setImportDragActive] = useState(false);
    const [importFileName, setImportFileName] = useState('');
    const [importRows, setImportRows] = useState<Array<{
        fullName: string;
        groupName: string;
        course: string;
        gender: string;
        origin: string;
        phone: string;
        birthday: string;
    }>>([]);
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; failed: number; failedStudents: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const importPreviewColumns = useMemo(() => ([
        { key: 'fullName', title: 'ФИО' },
        { key: 'groupName', title: 'Группа' },
        { key: 'course', title: 'Курс' },
        { key: 'gender', title: 'Пол' },
        { key: 'origin', title: 'Населенный пункт' },
        { key: 'phone', title: 'Телефон' },
        { key: 'birthday', title: 'Дата рождения' },
    ]), []);

    const handleImportCancel = useCallback(() => {
        setImportRows([]);
        setImportFileName('');
        setImportError(null);
        setImportResult(null);
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
            setImportResult(null);
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
                    fullName: getValue('ФИО'),
                    groupName: getValue('Группа'),
                    course: getValue('Курс'),
                    gender: getValue('Пол'),
                    origin: getValue('Населенный пункт'),
                    phone: getValue('Телефон'),
                    birthday: getValue('Дата рождения'),
                };
            }).filter(row => row.fullName);
            if (!parsedRows.length) {
                throw new Error('Не найдено строк с данными для импорта');
            }
            setImportRows(parsedRows);
        } catch (err: any) {
            console.error('Ошибка обработки файла импорта:', err);
            setImportRows([]);
            setImportFileName('');
            setImportError(err?.message || 'Не удалось обработать файл');
        }
    }, []);

    const handleImportSubmit = useCallback(async () => {
        if (!importRows.length) {
            setImportError('Сначала загрузите файл с данными');
            return;
        }
        setIsImporting(true);
        setImportError(null);
        setImportResult(null);
        let successCount = 0;
        let failedCount = 0;
        const failedStudents: string[] = [];
        for (const row of importRows) {
            const { surname, name, patronymic } = splitFullName(row.fullName);
            if (!surname || !name) {
                failedCount++;
                failedStudents.push(row.fullName || 'Без ФИО');
                continue;
            }
            const normalizedGroupName = row.groupName.trim().toLowerCase();
            const courseNumber = Number(row.course);
            const matchedGroup = groups.find(group => {
                if (!group.name) {
                    return false;
                }
                const nameMatch = group.name.trim().toLowerCase() === normalizedGroupName;
                if (!nameMatch) {
                    return false;
                }
                if (Number.isNaN(courseNumber) || !group.course) {
                    return true;
                }
                return group.course === courseNumber;
            });
            if (!matchedGroup) {
                failedCount++;
                failedStudents.push(row.fullName || 'Без ФИО');
                continue;
            }
            const birthdayIso = formatDateForApi(row.birthday);
            const genderValue = mapGenderFromText(row.gender);
            if (!birthdayIso || genderValue === null) {
                failedCount++;
                failedStudents.push(row.fullName || 'Без ФИО');
                continue;
            }
            const normalizedOrigin = row.origin?.trim() ?? '';
            const sanitizedPhone = sanitizePhone(row.phone);
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
                failedCount++;
                failedStudents.push(row.fullName || 'Без ФИО');
            }
        }
        await onImportComplete?.();
        setImportResult({ success: successCount, failed: failedCount, failedStudents });
        setIsImporting(false);
        setImportRows([]);
        setImportFileName('');
    }, [importRows, groups, onImportComplete]);

    const handleDownloadTemplate = useCallback(() => {
        const templateSheet = XLSX.utils.aoa_to_sheet([
            IMPORT_EXPECTED_HEADERS,
            ['Иванов Иван Иванович', 'ИС-21', '3', 'М', 'г. Пермь', '8XXXXXXXXXX', '12.08.2002'],
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

    return (
        <div className={styles.importTabWrapper}>
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
                    <p className={styles.importDropTitle}>Импорт студентов</p>
                    <p className={styles.importDropHint}>
                        Перетащите файл или{' '}
                        <button
                            type="button"
                            className={styles.importChooseLink}
                            onClick={handleDropZoneClick}
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
                {importResult && (
                    <div
                        className={`alert mt-3 ${importResult.failed ? 'alert-warning' : 'alert-success'}`}
                        role="alert"
                    >
                        <p className="mb-1">Успешно: {importResult.success}. Ошибки: {importResult.failed}.</p>
                        {importResult.failedStudents.length > 0 && (
                            <div>
                                <p className="mb-1">Не удалось импортировать:</p>
                                <ul className={styles.importFailedList}>
                                    {importResult.failedStudents.map((name, index) => (
                                        <li key={`${name}-${index}`}>{name || 'Строка без ФИО'}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                <div className={styles.previewTableWrapper}>
                    {importRows.length ? (
                        <CommonTable
                            data={importRows}
                            columns={importPreviewColumns}
                            className={styles.importPreviewTable}
                            emptyMessage="Строки для импорта отсутствуют"
                        />
                    ) : (
                        <div className={styles.previewPlaceholder}>
                            Таблица предварительного просмотра появится после выбора файла.
                        </div>
                    )}
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
