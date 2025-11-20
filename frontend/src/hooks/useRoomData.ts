// src/hooks/useRoomData.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { StudentsDto } from '../types/students';
import type { RoomDto } from '../types/rooms';

export const useRoomData = (roomId: number | null, enabled: boolean) => {
    const [room, setRoom] = useState<RoomDto | null>(null);
    const [neighbours, setNeighbours] = useState<StudentsDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled || roomId === null) {
            setRoom(null);
            setNeighbours([]);
            return;
        }

        const fetchRoomData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [roomRes, neighboursRes] = await Promise.all([
                    apiClient.getRoomById(roomId),
                    apiClient.getStudentsByRoomId(roomId),
                ]);
                setRoom(roomRes);
                setNeighbours(neighboursRes);
            } catch (err: any) {
                const msg = err.message || 'Ошибка при загрузке данных комнаты';
                setError(msg);
                setRoom(null);
                setNeighbours([]);
                console.error('Ошибка при загрузке данных комнаты:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRoomData();
    }, [roomId, enabled]);

    return { room, neighbours, loading, error };
};