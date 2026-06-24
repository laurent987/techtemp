import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import SensorCard from './SensorCard';

const base = { name: 'Zolder', temperature: 28.5, humidity: 67, status: 'online', ageLabel: 'il y a 2 min', color: '#22d3ee', selected: true };

function setup(props = {}) {
  const onToggle = vi.fn();
  render(<ChakraProvider theme={theme}><SensorCard {...base} {...props} onToggle={onToggle} /></ChakraProvider>);
  return { onToggle };
}

test('shows room name, temperature, humidity and labels', () => {
  setup();
  expect(screen.getByText('Zolder')).toBeInTheDocument();
  expect(screen.getByText(/28\.5/)).toBeInTheDocument();
  expect(screen.getByText(/67/)).toBeInTheDocument();
  expect(screen.getByText(/Température/i)).toBeInTheDocument();
  expect(screen.getByText(/Humidité/i)).toBeInTheDocument();
});

test('clicking the card calls onToggle', async () => {
  const { onToggle } = setup();
  await userEvent.click(screen.getByText('Zolder'));
  expect(onToggle).toHaveBeenCalledTimes(1);
});
