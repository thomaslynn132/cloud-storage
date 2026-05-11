import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileTypeIcon } from '@/components/file-type-icon';

describe('FileTypeIcon', () => {
  it('renders extension for known file type', () => {
    render(<FileTypeIcon fileName="document.pdf" />);
    expect(screen.getByText('pdf')).toBeInTheDocument();
  });

  it('renders extension for unknown file type', () => {
    render(<FileTypeIcon fileName="file.xyz" />);
    expect(screen.getByText('xyz')).toBeInTheDocument();
  });

  it('renders question mark for file without extension', () => {
    render(<FileTypeIcon fileName="Makefile" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('handles uppercase extensions', () => {
    render(<FileTypeIcon fileName="photo.JPG" />);
    expect(screen.getByText('jpg')).toBeInTheDocument();
  });
});
