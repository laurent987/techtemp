import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../../theme';
import MultiRoomChart from './MultiRoomChart';

// Keep tests offline/deterministic: the outdoor weather hook must not hit the network.
vi.mock('../../contexts/DataContext', () => ({
  useOutdoorWeather: () => ({ data: [], loading: false, error: null }),
}));

// jsdom has no canvas: stub the chart so rendering a populated chart doesn't crash.
vi.mock('react-chartjs-2', () => ({
  Line: () => null,
}));

// Stub the readings API so we can count fetches without hitting the network.
const getDeviceReadings = vi.fn(() => Promise.resolve([]));
vi.mock('../../services/api.service', () => ({
  getDeviceReadings: (...args) => getDeviceReadings(...args),
}));

beforeEach(() => {
  getDeviceReadings.mockClear();
});

// Render with no selected rooms -> shows the empty-state (no <Line>/canvas),
// but the control bar (metric toggle + period buttons) is still present.
function setup(props = {}) {
  const onMetricChange = vi.fn();
  render(
    <ChakraProvider theme={theme}>
      <MultiRoomChart roomUids={[]} metric="temperature" onMetricChange={onMetricChange} {...props} />
    </ChakraProvider>
  );
  return { onMetricChange };
}

test('shows the metric toggle in the chart header', () => {
  setup();
  expect(screen.getByRole('button', { name: /Température/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Humidité/i })).toBeInTheDocument();
});

test('clicking the humidity toggle calls onMetricChange', async () => {
  const { onMetricChange } = setup();
  await userEvent.click(screen.getByRole('button', { name: /Humidité/i }));
  expect(onMetricChange).toHaveBeenCalledWith('humidity');
});

test('period dropdown offers long ranges including 1 an', () => {
  setup();
  const select = screen.getByLabelText('Période');
  expect(select).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '1 an' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '3 mois' })).toBeInTheDocument();
});

test('auto-refreshes the chart on the current period', async () => {
  vi.useFakeTimers();
  try {
    render(
      <ChakraProvider theme={theme}>
        <MultiRoomChart roomUids={['room-1']} metric="temperature" />
      </ChakraProvider>
    );
    // Laisse le fetch initial se résoudre.
    await act(async () => { await Promise.resolve(); });
    expect(getDeviceReadings).toHaveBeenCalledTimes(1);

    // Après un cycle d'auto-refresh, l'appel est refait (même fenêtre).
    await act(async () => { vi.advanceTimersByTime(5 * 60_000); });
    expect(getDeviceReadings).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
  }
});

test('does NOT auto-refresh when navigating to a past period', async () => {
  vi.useFakeTimers();
  try {
    render(
      <ChakraProvider theme={theme}>
        <MultiRoomChart roomUids={['room-1']} metric="temperature" />
      </ChakraProvider>
    );
    await act(async () => { await Promise.resolve(); });
    expect(getDeviceReadings).toHaveBeenCalledTimes(1);

    // Flèche "période précédente" -> la fenêtre se termine dans le passé.
    await act(async () => {
      screen.getByRole('button', { name: /Période précédente/i }).click();
      await Promise.resolve();
    });
    const afterNav = getDeviceReadings.mock.calls.length; // re-fetch dû au changement de fenêtre

    // Aucun timer ne doit tourner : le compteur ne bouge plus.
    await act(async () => { vi.advanceTimersByTime(5 * 60_000); });
    expect(getDeviceReadings).toHaveBeenCalledTimes(afterNav);
  } finally {
    vi.useRealTimers();
  }
});
