import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const matchMediaMock = () => ({
  matches: false,
  media: '',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(matchMediaMock),
  });
});

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

test('renders the app title in the header', () => {
  render(<App />);
  expect(screen.getByText('Player Dashboard')).toBeInTheDocument();
});

test('renders both navigation links', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /Player Browser/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Team Formation/i })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Browser page (default)
// ---------------------------------------------------------------------------

test('shows the browser page by default', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Player Browser/i })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /Player/i })).toBeInTheDocument();
});

test('formation page is hidden on initial render', () => {
  render(<App />);
  expect(screen.queryByText(/Team Formation Visualizer/i)).not.toBeInTheDocument();
});

test('shows no player card before a player is selected', () => {
  render(<App />);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Formation page (after navigation)
// ---------------------------------------------------------------------------

test('switches to the formation page when Team Formation is clicked', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('link', { name: /Team Formation/i }));
  expect(screen.getByRole('heading', { name: /Team Formation Visualizer/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Generate Random Team/i })).toBeInTheDocument();
});

test('shows empty-state message on formation page before generating a team', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('link', { name: /Team Formation/i }));
  expect(screen.getByText(/Click Generate Random Team/i)).toBeInTheDocument();
});

test('switches back to browser page when Player Browser is clicked', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('link', { name: /Team Formation/i }));
  await userEvent.click(screen.getByRole('link', { name: /Player Browser/i }));
  expect(screen.getByRole('combobox', { name: /Player/i })).toBeInTheDocument();
  expect(screen.queryByText(/Team Formation Visualizer/i)).not.toBeInTheDocument();
});
