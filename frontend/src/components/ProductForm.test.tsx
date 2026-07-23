import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductForm } from './ProductForm';
import { api } from '../lib/api';

const baseProps = {
  submitLabel: 'Add product',
  submittingLabel: 'Adding...',
};

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('Name'), 'Wireless Mouse');
  await userEvent.type(screen.getByLabelText('Price (USD)'), '29.99');
  await userEvent.type(screen.getByLabelText('Stock'), '10');
  await userEvent.type(screen.getByLabelText('Category'), 'electronics');
}

describe('ProductForm', () => {
  it('renders all fields', () => {
    render(<ProductForm onSubmit={vi.fn()} {...baseProps} />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Price (USD)')).toBeInTheDocument();
    expect(screen.getByLabelText('Stock')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Image')).toBeInTheDocument();
  });

  it('shows a validation error for a name shorter than 2 characters', async () => {
    render(<ProductForm onSubmit={vi.fn()} {...baseProps} />);

    await userEvent.type(screen.getByLabelText('Name'), 'A');
    await userEvent.type(screen.getByLabelText('Price (USD)'), '10');
    await userEvent.type(screen.getByLabelText('Stock'), '1');
    await userEvent.type(screen.getByLabelText('Category'), 'misc');
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByText(/at least 2/)).toBeInTheDocument();
  });

  it('shows a validation error for a negative price', async () => {
    render(<ProductForm onSubmit={vi.fn()} {...baseProps} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Valid Name');
    await userEvent.type(screen.getByLabelText('Price (USD)'), '-5');
    await userEvent.type(screen.getByLabelText('Stock'), '1');
    await userEvent.type(screen.getByLabelText('Category'), 'misc');
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows a validation error for negative stock', async () => {
    render(<ProductForm onSubmit={vi.fn()} {...baseProps} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Valid Name');
    await userEvent.type(screen.getByLabelText('Price (USD)'), '10');
    await userEvent.type(screen.getByLabelText('Stock'), '-1');
    await userEvent.type(screen.getByLabelText('Category'), 'misc');
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByText('Stock cannot be negative')).toBeInTheDocument();
  });

  it('shows a validation error for a missing category', async () => {
    render(<ProductForm onSubmit={vi.fn()} {...baseProps} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Valid Name');
    await userEvent.type(screen.getByLabelText('Price (USD)'), '10');
    await userEvent.type(screen.getByLabelText('Stock'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByText('Category is required')).toBeInTheDocument();
  });

  it('shows a generic error message when the rejection has no error message', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network down'));
    render(<ProductForm onSubmit={onSubmit} {...baseProps} />);

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('renders the product image uploader input', async () => {
    render(<ProductForm onSubmit={vi.fn()} {...baseProps} />);

    const fileInput = screen.getByLabelText('Product Image');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
  });

  it('submits coerced numeric values and omits an empty image URL', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProductForm onSubmit={onSubmit} {...baseProps} />);

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByRole('button', { name: 'Add product' })).not.toBeDisabled();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Wireless Mouse',
        price: 29.99,
        stock: 10,
        category: 'electronics',
        imageUrl: undefined,
      })
    );
  });

  it('prefills fields from initialValues', () => {
    render(
      <ProductForm
        onSubmit={vi.fn()}
        initialValues={{
          name: 'Existing Product',
          description: 'Existing description',
          price: 12.5,
          stock: 3,
          category: 'fashion',
          imageUrl: 'https://images.unsplash.com/photo-xyz',
        }}
        {...baseProps}
      />
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Existing Product');
    expect(screen.getByLabelText('Price (USD)')).toHaveValue(12.5);
    expect(screen.getByLabelText('Stock')).toHaveValue(3);
    expect(screen.getByLabelText('Category')).toHaveValue('fashion');
  });

  it('shows the server error message when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      response: { data: { error: { message: 'Something specific went wrong.' } } },
    });
    render(<ProductForm onSubmit={onSubmit} {...baseProps} />);

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByText('Something specific went wrong.')).toBeInTheDocument();
  });

  it('does not render an image preview when there is no imageUrl', () => {
    render(<ProductForm onSubmit={vi.fn()} {...baseProps} />);

    expect(screen.queryByRole('img', { name: /product image preview/i })).not.toBeInTheDocument();
  });

  it('renders an image preview when editing a product with an existing imageUrl', () => {
    render(
      <ProductForm
        onSubmit={vi.fn()}
        initialValues={{
          name: 'Cake',
          price: 10,
          stock: 1,
          category: 'cakes & bakery',
          imageUrl: '/uploads/existing-cake.jpg',
        }}
        {...baseProps}
      />
    );

    const preview = screen.getByRole('img', { name: /product image preview/i });
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute('src', '/uploads/existing-cake.jpg');
  });

  it('shows an image preview after a file is selected and uploaded', async () => {
    const uploadSpy = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { data: { url: '/uploads/newly-uploaded.png' } } });

    render(<ProductForm onSubmit={vi.fn()} {...baseProps} />);

    const file = new File(['dummy'], 'cake.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText('Product Image'), file);

    const preview = await screen.findByRole('img', { name: /product image preview/i });
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute('src', '/uploads/newly-uploaded.png');
    expect(uploadSpy).toHaveBeenCalledWith('/upload', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    uploadSpy.mockRestore();
  });
});
