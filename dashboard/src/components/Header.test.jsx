import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import Header from './Header';

function renderHeader() {
  return render(<ChakraProvider theme={theme}><Header /></ChakraProvider>);
}

test('renders a color-mode toggle button', () => {
  renderHeader();
  expect(screen.getByLabelText('Basculer le thème clair/sombre')).toBeInTheDocument();
});

test('toggle button is clickable', async () => {
  renderHeader();
  const btn = screen.getByLabelText('Basculer le thème clair/sombre');
  await userEvent.click(btn); // must not throw
  expect(btn).toBeInTheDocument();
});
