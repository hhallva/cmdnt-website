import { useCallback, useMemo, useState } from 'react';
import type { RoomDto } from '../../../../types/rooms';
import type { StudentsDto } from '../../../../types/students';
import type { BlockWithRooms, FloorWithBlocks, RoomWithOccupants } from '../types';
import { deriveGenderTypeFromOccupants, formatShortName, getBlockKey } from '../utils';

export type SelectedStudentId = 'all' | number;
export type SelectedFloor = 'all' | number;
export type SelectedBlockKey = 'all' | string;

type UseStructureFiltersArgs = {
    rooms: RoomDto[];
    students: StudentsDto[];
};

export const useStructureFilters = ({ rooms, students }: UseStructureFiltersArgs) => {
    const [selectedStudentId, setSelectedStudentId] = useState<SelectedStudentId>('all');
    const [selectedFloor, setSelectedFloor] = useState<SelectedFloor>('all');
    const [selectedBlockKey, setSelectedBlockKey] = useState<SelectedBlockKey>('all');
    const [activeBlockKey, setActiveBlockKey] = useState<string | null>(null);

    const roomsById = useMemo(() => {
        const map = new Map<number, RoomDto>();
        rooms.forEach(room => map.set(room.id, room));
        return map;
    }, [rooms]);

    const roomsWithOccupants = useMemo<RoomWithOccupants[]>(() => {
        return rooms
            .map(room => ({
                ...room,
                occupants: students.filter(student => student.roomId === room.id),
            }))
            .sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber));
    }, [rooms, students]);

    const floorOptions = useMemo(() => {
        const floorsSet = new Set<number>();
        roomsWithOccupants.forEach(room => floorsSet.add(room.floorNumber));
        const options = Array.from(floorsSet)
            .sort((a, b) => a - b)
            .map(floor => ({ value: floor, label: `${floor} этаж` }));
        return [{ value: 'all', label: 'Все этажи' }, ...options];
    }, [roomsWithOccupants]);

    const blockOptions = useMemo(() => {
        const filteredRooms = selectedFloor === 'all'
            ? roomsWithOccupants
            : roomsWithOccupants.filter(room => room.floorNumber === selectedFloor);
        const blockMap = new Map<string, { label: string }>();
        filteredRooms.forEach(room => {
            const blockKey = getBlockKey(room.floorNumber, room.roomNumber);
            if (!blockMap.has(blockKey)) {
                blockMap.set(blockKey, { label: room.roomNumber });
            }
        });
        const options = Array.from(blockMap.entries())
            .sort((a, b) => a[1].label.localeCompare(b[1].label, 'ru'))
            .map(([value, data]) => ({ value, label: `${data.label}` }));
        const allLabel = selectedFloor === 'all' ? 'Все блоки' : 'Все блоки этажа';
        return [{ value: 'all', label: allLabel }, ...options];
    }, [roomsWithOccupants, selectedFloor]);

    const studentOptions = useMemo(() => {
        const studentsWithRooms = students.filter(student => student.roomId !== null && student.roomId !== undefined);
        let filtered = studentsWithRooms;
        if (selectedBlockKey !== 'all') {
            filtered = filtered.filter(student => {
                if (student.roomId === null || student.roomId === undefined) {
                    return false;
                }
                const room = roomsById.get(student.roomId);
                if (!room) {
                    return false;
                }
                return getBlockKey(room.floorNumber, room.roomNumber) === selectedBlockKey;
            });
        } else if (selectedFloor !== 'all') {
            filtered = filtered.filter(student => {
                if (student.roomId === null || student.roomId === undefined) {
                    return false;
                }
                const room = roomsById.get(student.roomId);
                return room?.floorNumber === selectedFloor;
            });
        }
        const allLabel = selectedBlockKey !== 'all'
            ? 'Все студенты блока'
            : selectedFloor !== 'all'
                ? 'Все студенты этажа'
                : 'Все студенты';
        const uniqueStudents = filtered
            .map(student => ({ value: student.id.toString(), label: formatShortName(student) }))
            .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
        return [{ value: 'all', label: allLabel }, ...uniqueStudents];
    }, [students, roomsById, selectedBlockKey, selectedFloor]);

    const resetFilters = useCallback(() => {
        setSelectedStudentId('all');
        setSelectedFloor('all');
        setSelectedBlockKey('all');
    }, []);

    const handleFloorFilterChange = useCallback((value: string) => {
        const nextFloor = value === 'all' ? 'all' : Number(value);
        setSelectedFloor(nextFloor);
        if (nextFloor === 'all') {
            return;
        }
        setSelectedBlockKey(prev => {
            if (prev === 'all') {
                return prev;
            }
            const [floorPart] = prev.split('-');
            return Number(floorPart) === nextFloor ? prev : 'all';
        });
        setSelectedStudentId(prev => {
            if (prev === 'all') {
                return prev;
            }
            const student = students.find(item => item.id === prev);
            if (!student?.roomId) {
                return 'all';
            }
            const room = roomsById.get(student.roomId);
            return room && room.floorNumber === nextFloor ? prev : 'all';
        });
    }, [roomsById, students]);

    const handleBlockFilterChange = useCallback((value: string) => {
        if (value === 'all') {
            setSelectedBlockKey('all');
            setSelectedStudentId('all');
            return;
        }
        setSelectedBlockKey(value);
        const [floorPart] = value.split('-');
        const floorNumber = Number(floorPart);
        if (!Number.isNaN(floorNumber)) {
            setSelectedFloor(floorNumber);
        }
        setSelectedStudentId(prev => {
            if (prev === 'all') {
                return prev;
            }
            const student = students.find(item => item.id === prev);
            if (!student?.roomId) {
                return 'all';
            }
            const room = roomsById.get(student.roomId);
            if (!room) {
                return 'all';
            }
            return getBlockKey(room.floorNumber, room.roomNumber) === value ? prev : 'all';
        });
    }, [roomsById, students]);

    const handleStudentFilterChange = useCallback((value: string) => {
        if (value === 'all') {
            setSelectedStudentId('all');
            return;
        }
        const studentId = Number(value);
        setSelectedStudentId(studentId);
        const student = students.find(item => item.id === studentId);
        if (!student?.roomId) {
            setSelectedBlockKey('all');
            return;
        }
        const room = roomsById.get(student.roomId);
        if (room) {
            setSelectedBlockKey(getBlockKey(room.floorNumber, room.roomNumber));
            setSelectedFloor(room.floorNumber);
        } else {
            setSelectedBlockKey('all');
        }
    }, [roomsById, students]);

    const filteredRooms = useMemo(() => {
        const targetBlockKey = selectedBlockKey === 'all' ? null : selectedBlockKey;

        return roomsWithOccupants.filter(room => {
            if (selectedFloor !== 'all' && room.floorNumber !== selectedFloor) {
                return false;
            }
            if (selectedStudentId !== 'all' && !room.occupants.some(student => student.id === selectedStudentId)) {
                return false;
            }

            if (targetBlockKey) {
                return getBlockKey(room.floorNumber, room.roomNumber) === targetBlockKey;
            }

            return true;
        });
    }, [roomsWithOccupants, selectedFloor, selectedBlockKey, selectedStudentId]);

    const floors = useMemo<FloorWithBlocks[]>(() => {
        const floorMap = new Map<number, Map<string, BlockWithRooms>>();

        filteredRooms.forEach(room => {
            if (!floorMap.has(room.floorNumber)) {
                floorMap.set(room.floorNumber, new Map());
            }

            const blocksMap = floorMap.get(room.floorNumber)!;
            const blockNumber = room.roomNumber;

            if (!blocksMap.has(blockNumber)) {
                blocksMap.set(blockNumber, {
                    blockNumber,
                    floorNumber: room.floorNumber,
                    rooms: [],
                    capacity: 0,
                    currentCapacity: 0,
                    genderType: room.genderType,
                });
            }

            const block = blocksMap.get(blockNumber)!;
            block.rooms.push(room);
            block.capacity += room.capacity;
            block.currentCapacity += room.currentCapacity;
            block.genderType = deriveGenderTypeFromOccupants(block.rooms);
        });

        return Array.from(floorMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([floor, blocksMap]) => {
                const blocks = Array.from(blocksMap.values())
                    .sort((a, b) => a.blockNumber.localeCompare(b.blockNumber, 'ru'));
                const total = blocks.reduce((acc, block) => acc + block.capacity, 0);
                const free = blocks.reduce((acc, block) => acc + Math.max(block.capacity - block.currentCapacity, 0), 0);
                return { floor, blocks, total, free };
            });
    }, [filteredRooms]);

    const activeBlock = useMemo(() => {
        if (!activeBlockKey) {
            return null;
        }

        for (const floor of floors) {
            const found = floor.blocks.find(block => getBlockKey(block.floorNumber, block.blockNumber) === activeBlockKey);
            if (found) {
                return found;
            }
        }

        return null;
    }, [activeBlockKey, floors]);

    const openBlockModal = useCallback((block: BlockWithRooms) => {
        setActiveBlockKey(getBlockKey(block.floorNumber, block.blockNumber));
    }, []);

    const closeBlockModal = useCallback(() => {
        setActiveBlockKey(null);
    }, []);

    return {
        roomsById,
        roomsWithOccupants,
        floorOptions,
        blockOptions,
        studentOptions,
        selectedStudentId,
        selectedFloor,
        selectedBlockKey,
        setSelectedStudentId,
        setSelectedFloor,
        setSelectedBlockKey,
        handleFloorFilterChange,
        handleBlockFilterChange,
        handleStudentFilterChange,
        resetFilters,
        floors,
        activeBlock,
        openBlockModal,
        closeBlockModal,
    };
};
