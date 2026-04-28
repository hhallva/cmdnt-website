import { useCallback, useEffect, useState } from 'react';
import { dormitoryApi } from '../api/dormitory';
import { apiClient } from '../api/client';
import type { RoomDto } from '../types/rooms';
import type { StudentsDto } from '../types/students';

export const useDormStructureData = (buildingId?: number) => {
    const [rooms, setRooms] = useState<RoomDto[]>([]);
    const [students, setStudents] = useState<StudentsDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [silentReload, setSilentReload] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (!silentReload) {
                setLoading(true);
            }
            setError(null);
            try {
                if (buildingId) {
                    const [rooms, students] = await Promise.all([
                        apiClient.getRoomsByBuildingId(buildingId),
                        apiClient.getAllStudents(),
                    ]);
                    if (!isMounted) {
                        return;
                    }
                    setRooms(rooms);
                    setStudents(students);
                } else {
                    const dataset = await dormitoryApi.fetchDataset();
                    if (!isMounted) {
                        return;
                    }
                    setRooms(dataset.rooms);
                    setStudents(dataset.students);
                }
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
                    setSilentReload(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [buildingId, reloadKey]);

    const refetch = useCallback((options?: { silent?: boolean }) => {
        if (options?.silent) {
            setSilentReload(true);
            setLoading(false);
        }
        setReloadKey(prev => prev + 1);
    }, []);

    return { rooms, students, loading, error, refetch };
};
