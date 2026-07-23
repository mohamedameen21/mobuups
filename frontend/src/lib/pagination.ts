/**
 * Generates Laravel-style pagination item numbers with ellipsis ('...').
 * Example output for page 5 of 10: [1, '...', 4, 5, 6, '...', 10]
 */
export function getPaginationItems(page: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | string)[] = [1];

  if (page > 3) items.push('...');

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let i = start; i <= end; i++) {
    if (i > 1 && i < totalPages) items.push(i);
  }

  if (page < totalPages - 2) items.push('...');
  if (totalPages > 1) items.push(totalPages);

  return items;
}
