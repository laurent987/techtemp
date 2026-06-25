import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import DashboardPage from './DashboardPage';

vi.mock('../contexts/DataContext', () => ({
  useDevices: () => ({
    devices: [
      { uid: 'zolder', room: { name: 'Zolder' }, last_seen_at: new Date().toISOString() },
      { uid: 'bureau', room: { name: 'Bureau' }, last_seen_at: new Date().toISOString() },
    ],
    loading: false,
    error: null,
  }),
  useLatestReadings: () => ({
    readings: [
      { deviceUid: 'zolder', temperature: 28.5, humidity: 67, ts: new Date().toISOString() },
      { deviceUid: 'bureau', temperature: 25.7, humidity: 70, ts: new Date().toISOString() },
    ],
    loading: false,
    error: null,
  }),
  useCurrentOutdoor: () => ({ data: { temperature: 32, humidity: 38 } }),
  useTodayStats: () => ({ tempMin: 24, tempMax: 29, humMin: 60, humMax: 78 }),
}));

vi.mock('../components/charts/MultiRoomChart', () => ({
  default: ({ roomUids, showOutdoor }) => (
    <div data-testid="chart">{showOutdoor ? 'OUT|' : ''}{roomUids.join(',')}</div>
  ),
}));

function setup() {
  render(<ChakraProvider theme={theme}><DashboardPage /></ChakraProvider>);
}

test('the first vignette is the outdoor "Extérieur" card', () => {
  setup();
  const names = screen.getAllByText(/Extérieur|Zolder|Bureau/).map((n) => n.textContent);
  expect(names[0]).toMatch(/Extérieur/);
});

test('outdoor selected by default -> chart shows the outdoor overlay + rooms', () => {
  setup();
  expect(screen.getByTestId('chart')).toHaveTextContent('OUT|zolder,bureau');
});

test('deselecting the outdoor card removes the overlay (rooms stay)', async () => {
  setup();
  await userEvent.click(screen.getByText('Extérieur'));
  const chart = screen.getByTestId('chart');
  expect(chart).not.toHaveTextContent('OUT|');
  expect(chart).toHaveTextContent('zolder,bureau');
});

test('clicking a room card removes it from the chart selection', async () => {
  setup();
  await userEvent.click(screen.getByText('Zolder'));
  expect(screen.getByTestId('chart')).toHaveTextContent('OUT|bureau');
});
