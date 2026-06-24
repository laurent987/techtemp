import React from 'react';
import { Box } from '@chakra-ui/react';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import { DataProvider } from './contexts/DataContext';

function App() {
  return (
    <DataProvider>
      <Box bg="app.bg" minH="100vh">
        <Header />
        <Box as="main" maxW="container.xl" mx="auto" p={{ base: 2, md: 6 }}>
          <DashboardPage />
        </Box>
      </Box>
    </DataProvider>
  );
}

export default App;
