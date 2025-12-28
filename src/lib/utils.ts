// Utility functions

export function formatDate(date: Date | string): string {
  // Handle date strings from PostgreSQL DATE type (YYYY-MM-DD)
  // to avoid timezone issues during SSR hydration
  if (typeof date === 'string') {
    // Parse as UTC to avoid timezone conversion
    const parts = date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const day = parseInt(parts[2]);
      const d = new Date(Date.UTC(year, month, day));
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });
    }
  }

  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}
