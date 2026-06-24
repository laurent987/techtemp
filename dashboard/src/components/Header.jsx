import React from 'react';
import { Box, Flex, Heading, IconButton, useColorMode } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      aria-label="Basculer le thème clair/sombre"
      icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      size="sm"
    />
  );
}

export default function Header() {
  return (
    <Box bg="app.surface" borderBottom="1px solid" borderColor="app.border" px={6} py={3}>
      <Flex align="center" justify="space-between" maxW="container.xl" mx="auto">
        <Heading size="md" color="app.text">
          🌡️ TechTemp
        </Heading>
        <ColorModeToggle />
      </Flex>
    </Box>
  );
}
