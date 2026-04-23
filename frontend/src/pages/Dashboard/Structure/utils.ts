import type { RoomDto } from '../../../types/rooms';
import type { StudentsDto } from '../../../types/students';
import type { BlockWithRooms, RoomStatus, RoomWithOccupants } from './types';

export const getStatus = (currentCapacity: number, capacity: number): RoomStatus => {
    if (currentCapacity === 0) {
        return 'free';
    }
    if (currentCapacity >= capacity) {
        return 'occupied';
    }
    return 'partial';
};

export const getInitials = (student: StudentsDto): string => {
    const initials = `${student.surname?.charAt(0) ?? ''}${student.name?.charAt(0) ?? ''}`;
    return initials || '—';
};

export const formatShortName = (student: StudentsDto): string => {
    const surname = student.surname?.trim() ?? '';
    const nameInitial = student.name ? `${student.name.trim().charAt(0)}.` : '';
    const patronymicInitial = student.patronymic ? `${student.patronymic.trim().charAt(0)}.` : '';
    const initials = [nameInitial, patronymicInitial].filter(Boolean).join(' ');
    return [surname, initials].filter(Boolean).join(' ').trim() || `Студент ${student.id}`;
};

export const formatFullName = (student: StudentsDto): string => {
    return [student.surname, student.name, student.patronymic].filter(Boolean).join(' ').trim();
};

export const getGenderLabel = (entity: Pick<BlockWithRooms, 'genderType' | 'currentCapacity' | 'rooms'>): string => {
    if (entity.currentCapacity === 0) {
        const roomGenders = entity.rooms
            .map(room => room.genderType)
            .filter((gender): gender is boolean => gender === true || gender === false);

        if (roomGenders.length === 0) {
            return '-';
        }

        const hasMaleRooms = roomGenders.some(gender => gender === true);
        const hasFemaleRooms = roomGenders.some(gender => gender === false);

        if (hasMaleRooms && hasFemaleRooms) {
            return 'Смешаный';
        }

        return hasMaleRooms ? 'Мужской' : 'Женский';
    }

    if (entity.genderType === null) {
        return 'Смешаный';
    }

    return entity.genderType ? 'Мужской' : 'Женский';
};

export const getStudentGenderLabel = (gender: StudentsDto['gender']): string => {
    if (gender === null || gender === undefined) {
        return 'Не указан';
    }
    return gender ? 'Мужской' : 'Женский';
};

export const formatBirthday = (birthday?: string | null): string => {
    if (!birthday) {
        return '—';
    }
    const parsed = new Date(birthday);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed);
};

export const deriveGenderTypeFromOccupants = (rooms: RoomWithOccupants[]): RoomWithOccupants['genderType'] => {
    const genders = rooms
        .flatMap(room => room.occupants)
        .map(student => student.gender)
        .filter((gender): gender is boolean => gender !== null);

    if (genders.length === 0) {
        return null;
    }

    const hasMaleStudents = genders.some(gender => gender === true);
    const hasFemaleStudents = genders.some(gender => gender === false);

    if (hasMaleStudents && hasFemaleStudents) {
        return null;
    }

    return hasMaleStudents ? true : false;
};

export const hasGenderValue = (value: boolean | null | undefined): value is boolean => value === true || value === false;

export const doesRoomMatchStudentGender = (
    room: RoomDto,
    studentGender: StudentsDto['gender'] | null | undefined
): boolean => {
    if (room.currentCapacity >= room.capacity) {
        return false;
    }

    if (!hasGenderValue(studentGender)) {
        return room.currentCapacity === 0;
    }

    if (room.currentCapacity === 0) {
        return true;
    }

    return hasGenderValue(room.genderType) && room.genderType === studentGender;
};

export const doesStudentMatchRoomGender = (
    studentGender: StudentsDto['gender'] | null | undefined,
    roomGender: RoomDto['genderType'] | null
): boolean => {
    if (!hasGenderValue(roomGender)) {
        return true;
    }

    return hasGenderValue(studentGender) && studentGender === roomGender;
};

export const getBlockKey = (floorNumber: number, blockNumber: string): string => `${floorNumber}-${blockNumber}`;
