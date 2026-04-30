import React from 'react';
import { Box, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { useDevices } from '../contexts/DataContext';

const NAV_ITEMS = [
  { path: '/', label: 'Maintenant', icon: '🌡️' },
  { path: '/charts', label: 'Historique', icon: '📊' }
];

function NavLink({ to, label, icon, active }) {
  return (
    <Link to={to}>
      <Box
        px={3}
        py={2}
        borderRadius="md"
        bg={active ? 'blue.500' : 'transparent'}
        color={active ? 'white' : 'gray.700'}
        _hover={{ bg: active ? 'blue.500' : 'gray.100' }}
        fontWeight={active ? 'semibold' : 'normal'}
      >
        <span style={{ marginRight: 6 }}>{icon}</span>
        {label}
      </Box>
    </Link>
  );
}

export default function Header() {
  const location = useLocation();
  const { devices, loading } = useDevices();

  return (
    <Box bg="white" borderBottom="1px solid" borderColor="gray.200" px={6} py={3}>
      <Flex align="center" justify="space-between" maxW="container.xl" mx="auto">
        <HStack spacing={3}>
          <Heading size="md" color="gray.800">
            🌡️ TechTemp
          </Heading>
          {!loading && (
            <Text fontSize="sm" color="gray.500">
              {devices.length} capteur{devices.length > 1 ? 's' : ''}
            </Text>
          )}
        </HStack>

        <HStack spacing={2}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              label={item.label}
              icon={item.icon}
              active={location.pathname === item.path}
            />
          ))}
        </HStack>
      </Flex>
    </Box>
  );
}
