import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import Header from './components/Header';
import LivePage from './pages/LivePage';
import ChartsPage from './pages/ChartsPage';
import { DataProvider } from './contexts/DataContext';

function App() {
  return (
    <Router>
      <DataProvider>
        <Box bg="gray.50" minH="100vh">
          <Header />
          <Box as="main" maxW="container.xl" mx="auto" p={{ base: 2, md: 6 }}>
            <Routes>
              <Route path="/" element={<LivePage />} />
              <Route path="/charts" element={<ChartsPage />} />
            </Routes>
          </Box>
        </Box>
      </DataProvider>
    </Router>
  );
}

export default App;
