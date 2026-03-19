// Utility helpers

export const formatDate = (dateString: string | Date): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const truncateText = (text: string, maxLength: number = 50): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

