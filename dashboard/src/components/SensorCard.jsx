import { Box, Flex, Text, Grid, GridItem } from '@chakra-ui/react';

const statusLabel = { online: 'En ligne', warn: 'Retard', offline: 'Hors ligne' };

export default function SensorCard({
  name,
  temperature,
  humidity,
  status = 'online',
  ageLabel,
  color = '#22d3ee',
  selected = false,
  onToggle,
}) {
  return (
    <Box
      onClick={onToggle}
      cursor="pointer"
      w="310px"
      bg="app.surface"
      borderWidth={selected ? '2px' : '1px'}
      borderColor={selected ? color : 'app.border'}
      boxShadow={selected ? `0 0 0 3px ${color}26` : 'sm'}
      opacity={selected ? 1 : 0.7}
      borderRadius="14px"
      p={4}
      transition="all .15s"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontWeight="600" fontSize="15px" color="app.text">
          <Box as="span" display="inline-block" w="9px" h="9px" borderRadius="full" bg={color} mr={2} />
          {name}
        </Text>
        <Text fontSize="11px" color="app.accent">{statusLabel[status]}</Text>
      </Flex>
      <Grid templateColumns="1fr 1fr" gap={3}>
        <GridItem textAlign="center">
          <Text fontSize="22px" lineHeight="1">🌡️</Text>
          <Text color="app.text" fontSize="28px" fontWeight="700" mt={1} lineHeight="1">
            {temperature?.toFixed(1)}°
          </Text>
          <Text color="app.textMuted" fontSize="11px" textTransform="uppercase" letterSpacing=".04em" mt={1}>
            Température
          </Text>
        </GridItem>
        <GridItem textAlign="center" borderLeftWidth="1px" borderColor="app.border">
          <Text fontSize="22px" lineHeight="1">💧</Text>
          <Text color="app.text" fontSize="28px" fontWeight="700" mt={1} lineHeight="1">
            {Math.round(humidity)}%
          </Text>
          <Text color="app.textMuted" fontSize="11px" textTransform="uppercase" letterSpacing=".04em" mt={1}>
            Humidité
          </Text>
        </GridItem>
      </Grid>
      {ageLabel && (
        <Text color="app.textMuted" fontSize="11px" mt={3} textAlign="right">
          {ageLabel}
        </Text>
      )}
    </Box>
  );
}
