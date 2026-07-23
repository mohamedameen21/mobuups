import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaginationBar, getPaginationItems } from './PaginationBar';

describe('getPaginationItems', () => {
  it('returns exact array when totalPages <= 7', () => {
    expect(getPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('formats items with leading and trailing ellipsis for middle pages', () => {
    expect(getPaginationItems(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
  });

  it('formats items near the beginning correctly', () => {
    expect(getPaginationItems(2, 10)).toEqual([1, 2, 3, '...', 10]);
  });

  it('formats items near the end correctly', () => {
    expect(getPaginationItems(9, 10)).toEqual([1, '...', 8, 9, 10]);
  });
});

describe('PaginationBar component', () => {
  const meta = { page: 2, limit: 5, total: 22, totalPages: 5 };

  it('renders summary text and page number buttons', () => {
    render(<PaginationBar meta={meta} onPageChange={vi.fn()} />);

    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument(); // from (2-1)*5+1
    expect(screen.getByText('10')).toBeInTheDocument(); // to min(22, 2*5)
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  it('triggers onPageChange when clicking a page number button', () => {
    const handlePageChange = vi.fn();
    render(<PaginationBar meta={meta} onPageChange={handlePageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('triggers onPageChange for first, previous, next, and last controls', () => {
    const handlePageChange = vi.fn();
    render(<PaginationBar meta={meta} onPageChange={handlePageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'First page' }));
    expect(handlePageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(handlePageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(handlePageChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole('button', { name: 'Last page' }));
    expect(handlePageChange).toHaveBeenCalledWith(5);
  });
});
