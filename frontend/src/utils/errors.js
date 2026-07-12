export const formatApiError = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || fallback;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (data.error || data.detail) {
    return data.error || data.detail;
  }

  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([field, value]) => {
        const message = Array.isArray(value)
          ? value.join(', ')
          : typeof value === 'object'
            ? JSON.stringify(value)
            : value;

        return `${field}: ${message}`;
      })
      .join('\n');
  }

  return fallback;
};
