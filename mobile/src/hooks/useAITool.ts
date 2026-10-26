import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/DocumentService';

// Loads one piece of AI-generated content for the current document.
// `reload(true)` asks the server to regenerate instead of returning the cached copy.
export const useAITool = <T>(fetcher: (refresh: boolean) => Promise<T>) => {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;
    const requestId = useRef(0);

    const reload = useCallback(async (refresh = false) => {
        const id = ++requestId.current;
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetcherRef.current(refresh);
            if (id === requestId.current) setData(result);
        } catch (err) {
            if (id === requestId.current) setError(getErrorMessage(err, 'The AI could not generate this right now.'));
        } finally {
            if (id === requestId.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        reload(false);
        // Ignore results that arrive after the screen is closed
        return () => {
            requestId.current++;
        };
    }, [reload]);

    return { data, setData, isLoading, error, reload };
};

export default useAITool;
