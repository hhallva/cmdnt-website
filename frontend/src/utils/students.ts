import * as XLSX from 'xlsx';

export const PHONE_REGEX = /^\+79\d{9}$/;

export const isPhoneValid = (value?: string | null): boolean => {
    const normalized = value?.trim() ?? '';
    if (!normalized) {
        return false;
    }
    return PHONE_REGEX.test(normalized);
};

export const sanitizePhone = (value: string): string | null => {
    if (!value) {
        return null;
    }
    const digits = value.replace(/\D/g, '');
    if (!digits) {
        return null;
    }
    if (digits.length === 11 && digits.startsWith('8')) {
        return `+7${digits.slice(1)}`;
    }
    if (digits.length === 11 && digits.startsWith('7')) {
        return `+${digits}`;
    }
    if (digits.length === 10 && digits.startsWith('9')) {
        return `+7${digits}`;
    }
    return value.startsWith('+') ? value : `+${digits}`;
};

export interface SplitFullNameResult {
    surname: string;
    name: string;
    patronymic: string;
}

export const splitFullName = (fullName: string): SplitFullNameResult => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return {
        surname: parts[0] ?? '',
        name: parts[1] ?? '',
        patronymic: parts.slice(2).join(' '),
    };
};

export const mapGenderFromText = (value: string): boolean | null => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
        return null;
    }
    if (normalized.startsWith('м')) {
        return true;
    }
    if (normalized.startsWith('ж')) {
        return false;
    }
    return null;
};

export const formatDateForApi = (rawValue: string): string | null => {
    const trimmed = rawValue?.toString().trim();
    if (!trimmed) {
        return null;
    }
    const numericValue = Number(trimmed);
    if (!Number.isNaN(numericValue) && numericValue > 20000) {
        const parsed = XLSX.SSF.parse_date_code(numericValue);
        if (parsed) {
            const month = `${parsed.m}`.padStart(2, '0');
            const day = `${parsed.d}`.padStart(2, '0');
            return `${parsed.y}-${month}-${day}`;
        }
    }
    const replaced = trimmed.replace(/[./]/g, '-');
    const date = new Date(replaced);
    if (!Number.isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
    }
    const dotParts = trimmed.split('.');
    if (dotParts.length === 3) {
        const [day, month, yearRaw] = dotParts;
        const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
        const isoCandidate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const parsedDate = new Date(isoCandidate);
        if (!Number.isNaN(parsedDate.getTime())) {
            return isoCandidate;
        }
    }
    return null;
};

export const formatBirthday = (birthday?: string | null): string => {
    if (!birthday) {
        return '—';
    }
    const parsed = new Date(birthday);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(parsed);
};

export const formatBirthdayForExport = (birthday?: string | null): string => {
    if (!birthday) {
        return '';
    }
    const parsed = new Date(birthday);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(parsed);
};

export const formatGenderShort = (value?: boolean | null): string => {
    if (value === null || value === undefined) {
        return '';
    }
    return value ? 'М' : 'Ж';
};

export const getGenderLabel = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) {
        return 'Нет';
    }
    return value ? 'М' : 'Ж';
};
