import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';

test('App renders without crashing', () => {
  const { container } = render(
    <ChakraProvider>
      <App />
    </ChakraProvider>
  );
  expect(container).toBeTruthy();
});
