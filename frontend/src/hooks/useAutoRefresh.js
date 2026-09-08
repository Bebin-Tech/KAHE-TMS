import { useEffect, useRef } from 'react';

const useAutoRefresh = (callback, intervalMs = 10000, enabled = true) => {
  const callbackRef = useRef(callback);
  const refreshRunningRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    const refresh = async () => {
      if (document.visibilityState !== 'visible' || refreshRunningRef.current) return;

      refreshRunningRef.current = true;
      try {
        await callbackRef.current();
      } finally {
        refreshRunningRef.current = false;
      }
    };

    const intervalId = window.setInterval(refresh, intervalMs);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, intervalMs]);
};

export default useAutoRefresh;
