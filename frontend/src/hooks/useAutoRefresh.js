import { useEffect } from 'react';

const useAutoRefresh = (callback, intervalMs = 10000, enabled = true) => {
  useEffect(() => {
    if (!enabled) return undefined;

    const refresh = () => {
      if (document.visibilityState === 'visible') {
        callback();
      }
    };

    const intervalId = window.setInterval(refresh, intervalMs);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        callback();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callback, enabled, intervalMs]);
};

export default useAutoRefresh;
