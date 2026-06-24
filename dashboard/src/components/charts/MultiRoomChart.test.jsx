import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../../theme';
import MultiRoomChart from './MultiRoomChart';

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

test('shows the metric toggle and period buttons in the chart header', () => {
  setup();
  expect(screen.getByRole('button', { name: /Température/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Humidité/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '3j' })).toBeInTheDocument();
});

test('clicking the humidity toggle calls onMetricChange', async () => {
  const { onMetricChange } = setup();
  await userEvent.click(screen.getByRole('button', { name: /Humidité/i }));
  expect(onMetricChange).toHaveBeenCalledWith('humidity');
});
