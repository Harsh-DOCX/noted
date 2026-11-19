import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

test('shows the home page and the requested navigation links', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /good thoughts belong somewhere/i })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: /main navigation/i }).querySelectorAll('a')).toHaveLength(5);
  expect(screen.getByRole('img', { name: 'Noted' })).toHaveAttribute('src', '/noted-logo.svg');
});

test('navigates to a page from the navbar', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: 'About us' }));

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /a home for your pdfs/i })).toBeInTheDocument();
  });
});

test('adds a PDF note and lists it in the notes page', async () => {
  URL.createObjectURL = jest.fn(() => 'blob:note');
  URL.revokeObjectURL = jest.fn();
  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: /add a pdf/i }));
  const file = new File(['%PDF-1.7'], 'meeting-notes.pdf', { type: 'application/pdf' });
  fireEvent.change(screen.getByLabelText('PDF file'), { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Add PDF note' }));

  expect(await screen.findByRole('heading', { name: 'Notes' })).toBeInTheDocument();
  expect(screen.getByText('meeting-notes.pdf')).toBeInTheDocument();
});
