import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import DashboardPage from './DashboardPage';

// Mock the data context with the REAL hook shapes:
// useDevices() -> { devices: [...] }, useLatestReadings() -> { readings: [...] }
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
}));

// Stub the chart so the test asserts the selection it receives (no canvas).
vi.mock('../components/charts/MultiRoomChart', () => ({
  default: ({ roomUids, metric }) => (
    <div data-testid="chart">{metric}:{roomUids.join(',')}</div>
  ),
}));

function setup() {
  render(<ChakraProvider theme={theme}><DashboardPage /></ChakraProvider>);
}

test('renders a card per room', () => {
  setup();
  expect(screen.getByText('Zolder')).toBeInTheDocument();
  expect(screen.getByText('Bureau')).toBeInTheDocument();
});

test('all rooms selected by default drive the chart', () => {
  setup();
  expect(screen.getByTestId('chart')).toHaveTextContent('temperature:zolder,bureau');
});

test('clicking a card removes it from the chart selection', async () => {
  setup();
  await userEvent.click(screen.getByText('Zolder'));
  expect(screen.getByTestId('chart')).toHaveTextContent('temperature:bureau');
});
