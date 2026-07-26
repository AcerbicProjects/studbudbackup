// src/api/reactQueryClient.ts
import { QueryClient } from '@tanstack/react-query';

// Create a QueryClient with sensible defaults
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 2,
            refetchOnWindowFocus: true,
        },
        mutations: {
            retry: 2,
        },
    },
});

// Persistence setup removed for now

export default queryClient;
