import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { RoomDto } from '../../../../types/rooms';
import type { StudentsDto } from '../../../../types/students';
import type { RoomWithOccupants, SettlementFormErrors, SettlementFormState } from '../types';
import { STRUCTURE_SETTLEMENT_PREFILL_KEY } from '../constants';
import { apiClient } from '../../../../api/client';
import { doesRoomMatchStudentGender, doesStudentMatchRoomGender, formatShortName, hasGenderValue } from '../utils';

const settlementFormInitialState: SettlementFormState = {
    studentId: '',
    floorNumber: '',
    roomId: '',
};

type UseSettlementFormArgs = {
    rooms: RoomDto[];
    roomsById: Map<number, RoomDto>;
    unassignedStudents: StudentsDto[];
    canManageRooms: boolean;
    onSuccess: () => Promise<void>;
    refreshStatistics: () => Promise<void>;
    activateSettlementTab: () => void;
};

export const useSettlementForm = ({
    rooms,
    roomsById,
    unassignedStudents,
    canManageRooms,
    onSuccess,
    refreshStatistics,
    activateSettlementTab,
}: UseSettlementFormArgs) => {
    const [settlementForm, setSettlementForm] = useState<SettlementFormState>(settlementFormInitialState);
    const [settlementErrors, setSettlementErrors] = useState<SettlementFormErrors>({});
    const [settlementAlert, setSettlementAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isSettling, setIsSettling] = useState(false);

    const [pendingSettlementStudentId, setPendingSettlementStudentId] = useState<string | null>(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        const payload = sessionStorage.getItem(STRUCTURE_SETTLEMENT_PREFILL_KEY);
        if (!payload) {
            return null;
        }
        sessionStorage.removeItem(STRUCTURE_SETTLEMENT_PREFILL_KEY);
        try {
            const parsed = JSON.parse(payload);
            return parsed?.studentId ? String(parsed.studentId) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (!settlementAlert) {
            return;
        }
        const timeout = window.setTimeout(() => {
            setSettlementAlert(null);
        }, 4000);
        return () => window.clearTimeout(timeout);
    }, [settlementAlert]);

    useEffect(() => {
        if (!canManageRooms) {
            return;
        }
        if (!pendingSettlementStudentId) {
            return;
        }
        const canPrefill = unassignedStudents.some(student => student.id.toString() === pendingSettlementStudentId);
        if (!canPrefill) {
            return;
        }
        setSettlementForm(prev => ({ ...prev, studentId: pendingSettlementStudentId }));
        setSettlementErrors(prev => ({ ...prev, studentId: undefined }));
        activateSettlementTab();
        setPendingSettlementStudentId(null);
    }, [pendingSettlementStudentId, unassignedStudents, canManageRooms, activateSettlementTab]);

    const availableRooms = useMemo(() => {
        return rooms.filter(room => room.currentCapacity < room.capacity);
    }, [rooms]);

    const selectedSettlementStudent = useMemo(() => {
        if (!settlementForm.studentId) {
            return null;
        }
        return unassignedStudents.find(student => student.id.toString() === settlementForm.studentId) ?? null;
    }, [settlementForm.studentId, unassignedStudents]);

    const filteredAvailableRooms = useMemo(() => {
        if (!selectedSettlementStudent) {
            return availableRooms;
        }
        return availableRooms.filter(room => doesRoomMatchStudentGender(room, selectedSettlementStudent.gender));
    }, [availableRooms, selectedSettlementStudent]);

    const selectedSettlementRoom = useMemo(() => {
        if (!settlementForm.roomId) {
            return null;
        }
        return rooms.find(room => room.id === Number(settlementForm.roomId)) ?? null;
    }, [rooms, settlementForm.roomId]);

    const selectedRoomGender = useMemo(() => {
        if (!selectedSettlementRoom) {
            return null;
        }
        return hasGenderValue(selectedSettlementRoom.genderType) ? selectedSettlementRoom.genderType : null;
    }, [selectedSettlementRoom]);

    const filteredSettlementStudents = useMemo(() => {
        if (!hasGenderValue(selectedRoomGender)) {
            return unassignedStudents;
        }
        return unassignedStudents.filter(student => doesStudentMatchRoomGender(student.gender, selectedRoomGender));
    }, [unassignedStudents, selectedRoomGender]);

    const settlementStudentOptions = useMemo(() => {
        return [
            { value: '', label: 'Выберите студента' },
            ...filteredSettlementStudents
                .map(student => ({ value: student.id.toString(), label: formatShortName(student) }))
                .sort((a, b) => a.label.localeCompare(b.label, 'ru')),
        ];
    }, [filteredSettlementStudents]);

    const settlementFloorOptions = useMemo(() => {
        const floorsSet = new Set<number>();
        filteredAvailableRooms.forEach(room => floorsSet.add(room.floorNumber));
        const floorOptions = Array.from(floorsSet)
            .sort((a, b) => a - b)
            .map(floor => ({ value: floor.toString(), label: `${floor} этаж` }));
        return [{ value: '', label: 'Выберите этаж' }, ...floorOptions];
    }, [filteredAvailableRooms]);

    const settlementRoomOptions = useMemo(() => {
        const targetRooms = settlementForm.floorNumber
            ? filteredAvailableRooms.filter(room => room.floorNumber === Number(settlementForm.floorNumber))
            : filteredAvailableRooms;

        const sortedRooms = targetRooms
            .slice()
            .sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber))
            .map(room => ({
                value: room.id.toString(),
                label: `${room.roomNumber} (${room.currentCapacity}/${room.capacity})`,
            }));

        return [
            {
                value: '',
                label: sortedRooms.length ? 'Выберите комнату' : 'Нет доступных комнат',
            },
            ...sortedRooms,
        ];
    }, [filteredAvailableRooms, settlementForm.floorNumber]);

    const handleSettlementStudentChange = useCallback((value: string) => {
        setSettlementForm(prev => {
            const nextState = { ...prev, studentId: value };

            if (!value || !nextState.roomId) {
                return nextState;
            }

            const selectedStudent = unassignedStudents.find(student => student.id.toString() === value);
            if (!selectedStudent) {
                return nextState;
            }

            const room = roomsById.get(Number(nextState.roomId));
            if (room && !doesRoomMatchStudentGender(room, selectedStudent.gender)) {
                nextState.roomId = '';
            }

            return nextState;
        });
        if (settlementErrors.studentId) {
            setSettlementErrors(prev => ({ ...prev, studentId: undefined }));
        }
        setSettlementAlert(null);
    }, [roomsById, settlementErrors.studentId, unassignedStudents]);

    const handleSettlementFloorChange = useCallback((value: string) => {
        setSettlementForm(prev => {
            const nextState = { ...prev, floorNumber: value };
            if (value && prev.roomId) {
                const currentRoom = roomsById.get(Number(prev.roomId));
                if (currentRoom && currentRoom.floorNumber.toString() !== value) {
                    nextState.roomId = '';
                }
            }
            return nextState;
        });
        setSettlementAlert(null);
    }, [roomsById]);

    const handleSettlementRoomChange = useCallback((value: string) => {
        setSettlementForm(prev => {
            if (!value) {
                return { ...prev, roomId: '', floorNumber: prev.floorNumber };
            }
            const room = roomsById.get(Number(value));
            const nextState = {
                ...prev,
                roomId: value,
                floorNumber: room ? room.floorNumber.toString() : prev.floorNumber,
            };

            if (room && prev.studentId) {
                const student = unassignedStudents.find(item => item.id.toString() === prev.studentId);
                if (student && !doesRoomMatchStudentGender(room, student.gender)) {
                    nextState.studentId = '';
                }
            }

            return nextState;
        });
        if (settlementErrors.roomId) {
            setSettlementErrors(prev => ({ ...prev, roomId: undefined }));
        }
        setSettlementAlert(null);
    }, [roomsById, settlementErrors.roomId, unassignedStudents]);

    const handleSettlementReset = useCallback(() => {
        setSettlementForm(settlementFormInitialState);
        setSettlementErrors({});
        setSettlementAlert(null);
    }, []);

    const handleSettlementSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const errors: SettlementFormErrors = {};
        if (!settlementForm.studentId) {
            errors.studentId = 'Выберите студента';
        }
        if (!settlementForm.roomId) {
            errors.roomId = 'Выберите комнату';
        }
        setSettlementErrors(errors);
        if (Object.keys(errors).length > 0) {
            setSettlementAlert({ type: 'error', message: 'Заполните обязательные поля' });
            return;
        }

        setSettlementAlert(null);
        setIsSettling(true);
        try {
            await apiClient.assignStudentToRoom(Number(settlementForm.studentId), Number(settlementForm.roomId));
            setSettlementForm(settlementFormInitialState);
            setSettlementErrors({});
            setSettlementAlert({ type: 'success', message: 'Студент успешно заселён' });
            await onSuccess();
            await refreshStatistics();
        } catch (err: any) {
            setSettlementAlert({ type: 'error', message: err?.message || 'Не удалось заселить студента' });
        } finally {
            setIsSettling(false);
        }
    }, [settlementForm, onSuccess, refreshStatistics]);

    const prefillRoomSelection = useCallback((room: RoomWithOccupants) => {
        if (!canManageRooms) {
            return;
        }
        activateSettlementTab();
        setSettlementForm(prev => {
            const nextState = {
                ...prev,
                floorNumber: room.floorNumber.toString(),
                roomId: room.id.toString(),
            };

            if (prev.studentId) {
                const student = unassignedStudents.find(item => item.id.toString() === prev.studentId);
                if (student && !doesRoomMatchStudentGender(room, student.gender)) {
                    nextState.studentId = '';
                }
            }

            return nextState;
        });
        setSettlementErrors(prev => ({ ...prev, roomId: undefined }));
        setSettlementAlert(null);
    }, [activateSettlementTab, canManageRooms, unassignedStudents]);

    const isStudentSelectDisabled = isSettling || unassignedStudents.length === 0;
    const isRoomSelectDisabled = isSettling || filteredAvailableRooms.length === 0;
    const isSubmitDisabled = isSettling || !unassignedStudents.length || !filteredAvailableRooms.length;

    return {
        settlementForm,
        settlementErrors,
        settlementAlert,
        isSettling,
        settlementStudentOptions,
        settlementFloorOptions,
        settlementRoomOptions,
        handleSettlementStudentChange,
        handleSettlementFloorChange,
        handleSettlementRoomChange,
        handleSettlementReset,
        handleSettlementSubmit,
        prefillRoomSelection,
        setSettlementAlert,
        isStudentSelectDisabled,
        isRoomSelectDisabled,
        isSubmitDisabled,
    };
};
