// src/hooks/useStudentData.ts
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { StudentsDto } from '../types/students';

const studentQueryKeys = {
    detail: (studentId: number) => ['student', studentId] as const,
};

export const useStudentData = (studentId: number) => {
    const isValidStudentId = Number.isFinite(studentId) && studentId > 0;
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: studentQueryKeys.detail(studentId),
        enabled: isValidStudentId,
        queryFn: async () => {
            try {
                const [studentRes, contactsRes, extRes] = await Promise.all([
                    apiClient.getStudentById(studentId),
                    apiClient.getStudentContactsById(studentId),
                    apiClient.getExtStudentById(studentId),
                ]);

                console.info(`Получение данных студента с ID: ${studentId}`);

                return {
                    student: {
                        ...studentRes,
                        contacts: contactsRes,
                        origin: extRes.origin,
                    },
                    notFound: false,
                };
            } catch (err: unknown) {
                const status = (err as { status?: number })?.status;
                if (status === 404) {
                    return {
                        student: null as StudentsDto | null,
                        notFound: true,
                    };
                }

                throw err;
            }
        },
    });

    const finalError = !isValidStudentId
        ? 'Некорректный ID студента'
        : error instanceof Error
            ? error.message
            : null;

    const refetchStudent = useCallback(() => {
        void refetch();
    }, [refetch]);

    return {
        student: data?.student ?? null,
        loading: isValidStudentId ? isLoading : false,
        error: finalError,
        notFound: data?.notFound ?? false,
        refetch: refetchStudent,
    };
};