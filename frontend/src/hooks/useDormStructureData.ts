import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { RoomDto } from '../types/rooms';
import type { StudentsDto } from '../types/students';

export const useDormStructureData = (buildingId?: number) => {
    const [rooms, setRooms] = useState<RoomDto[]>([]);
    const [students, setStudents] = useState<StudentsDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            setError(null);

            if (!buildingId) {
                if (!isMounted) {
                    return;
                }
                setRooms([]);
                setStudents([]);
                setError('Здание не найдено');
                setLoading(false);
                return;
            }

            try {
                const [rooms, students] = await Promise.all([
                    apiClient.getRoomsByBuildingId(buildingId),
                    apiClient.getAllStudents(),
                ]);
                if (!isMounted) {
                    return;
                }
                setRooms(rooms);
                setStudents(students);
            } catch (err: any) {
                if (!isMounted) {
                    return;
                }
                const msg = err?.message || 'Не удалось загрузить структуру общежития';
                setError(msg);
                console.error('Ошибка при загрузке структуры общежития:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [buildingId, reloadKey]);

    const refetch = useCallback(() => {
        setReloadKey(prev => prev + 1);
    }, []);

    return { rooms, students, loading, error, refetch };
};
