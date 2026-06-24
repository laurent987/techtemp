import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import SensorCard from './SensorCard';

const base = {
  name: 'Bureau', temperature: 28.0, humidity: 75, status: 'online',
  ageLabel: 'il y a 2 min', color: '#22d3ee', selected: true,
  humidex: 38, humidexColor: '#fb923c', humidexLabel: 'lourd', dewPoint: 23.2,
  todayTemp: { min: 24, max: 29 }, todayHum: { min: 60, max: 78 },
};

function setup(props = {}) {
  const onToggle = vi.fn();
  render(<ChakraProvider theme={theme}><SensorCard {...base} {...props} onToggle={onToggle} /></ChakraProvider>);
  return { onToggle };
}

test('front shows temp/humidity and a status dot (no "En ligne" text)', () => {
  setup();
  expect(screen.getByText(/28\.0/)).toBeInTheDocument();
  expect(screen.getByText(/75/)).toBeInTheDocument();
  expect(screen.getByLabelText('En ligne')).toBeInTheDocument();
  expect(screen.queryByText('En ligne')).not.toBeInTheDocument();
});

test('clicking the body toggles selection (does not flip)', async () => {
  const { onToggle } = setup();
  await userEvent.click(screen.getByText('Bureau'));
  expect(onToggle).toHaveBeenCalledTimes(1);
});

test('the ⓘ button flips to the back WITHOUT toggling selection', async () => {
  const { onToggle } = setup();
  await userEvent.click(screen.getByLabelText('Voir les détails'));
  expect(onToggle).not.toHaveBeenCalled();
  expect(screen.getByText(/Point de rosée/i)).toBeInTheDocument();
  expect(screen.getByText(/23\.2/)).toBeInTheDocument();
  expect(screen.getByText(/lourd/i)).toBeInTheDocument();
  expect(screen.getByTestId('card-back')).toHaveAttribute('aria-hidden', 'false');
});
