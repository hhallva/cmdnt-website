import { useCallback, useState } from 'react';

type SortDirection = 'asc' | 'desc';

type SortConfig<TKey extends string> = {
    key: TKey;
    direction: SortDirection;
};

export const useSortableConfig = <TKey extends string>(
    initialConfig: SortConfig<TKey> | null,
    allowedKeys?: readonly TKey[]
) => {
    const [sortConfig, setSortConfig] = useState<SortConfig<TKey> | null>(initialConfig);

    const requestSort = useCallback((key: string) => {
        const typedKey = key as TKey;
        if (allowedKeys && !allowedKeys.includes(typedKey)) {
            return;
        }

        setSortConfig(prevConfig => {
            if (prevConfig && prevConfig.key === typedKey) {
                return {
                    key: typedKey,
                    direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
                };
            }

            return { key: typedKey, direction: 'asc' };
        });
    }, [allowedKeys]);

    return {
        sortConfig,
        setSortConfig,
        requestSort,
    };
};
