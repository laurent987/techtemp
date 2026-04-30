import React, { useMemo } from 'react';
import {
  Box,
  Heading,
  HStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Tag,
  Text,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { useDevices, useLatestReadings } from '../contexts/DataContext';

const ONLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 min — un capteur publie toutes les 5 min
const WARN_THRESHOLD_MS = 30 * 60 * 1000;

function formatAge(ts) {
  if (!ts) return 'jamais';
  const sec = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}j`;
}

function statusFor(ts) {
  if (!ts) return { label: 'Jamais vu', color: 'gray' };
  const age = Date.now() - new Date(ts).getTime();
  if (age <= ONLINE_THRESHOLD_MS) return { label: 'En ligne', color: 'green' };
  if (age <= WARN_THRESHOLD_MS) return { label: 'Retard', color: 'yellow' };
  return { label: 'Hors ligne', color: 'red' };
}

function tempColor(temp) {
  if (temp == null) return 'gray.500';
  if (temp < 18) return 'cyan.500';
  if (temp <= 24) return 'green.500';
  if (temp <= 27) return 'orange.500';
  return 'red.500';
}

function humidityColor(h) {
  if (h == null) return 'gray.500';
  if (h < 30) return 'orange.500';
  if (h <= 60) return 'green.500';
  return 'blue.500';
}

function DeviceCard({ device, reading }) {
  const status = statusFor(reading?.ts || device.last_seen_at);
  const isStale = !reading || status.color !== 'green';

  return (
    <Box
      bg="white"
      borderRadius="xl"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="gray.200"
      p={5}
      opacity={isStale ? 0.85 : 1}
    >
      <HStack justify="space-between" mb={3}>
        <Heading size="md" color="gray.800">
          {device.room_name || device.label || device.uid}
        </Heading>
        <Tag colorScheme={status.color} borderRadius="full" size="sm">
          {status.label}
        </Tag>
      </HStack>

      <HStack spacing={6} align="flex-start">
        <Stat>
          <StatLabel color="gray.500" fontSize="xs">Température</StatLabel>
          <StatNumber color={tempColor(reading?.temperature)} fontSize="3xl">
            {reading?.temperature != null ? `${reading.temperature.toFixed(1)} °C` : '—'}
          </StatNumber>
        </Stat>
        <Stat>
          <StatLabel color="gray.500" fontSize="xs">Humidité</StatLabel>
          <StatNumber color={humidityColor(reading?.humidity)} fontSize="3xl">
            {reading?.humidity != null ? `${reading.humidity.toFixed(0)} %` : '—'}
          </StatNumber>
        </Stat>
      </HStack>

      <Text color="gray.500" fontSize="xs" mt={3}>
        Dernière mesure : il y a {formatAge(reading?.ts || device.last_seen_at)}
      </Text>
    </Box>
  );
}

export default function LivePage() {
  const { devices, loading: devicesLoading, error: devicesError } = useDevices();
  const { readings, loading: readingsLoading, error: readingsError, lastFetchedAt } = useLatestReadings(30_000);

  const readingByDevice = useMemo(() => {
    const map = new Map();
    readings.forEach((r) => map.set(r.deviceUid, r));
    return map;
  }, [readings]);

  // Most recently seen first.
  const sortedDevices = useMemo(
    () =>
      [...devices].sort((a, b) => {
        const ta = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const tb = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return tb - ta;
      }),
    [devices]
  );

  const onlineCount = sortedDevices.filter((d) => {
    const r = readingByDevice.get(d.uid);
    return statusFor(r?.ts || d.last_seen_at).color === 'green';
  }).length;

  if (devicesLoading && devices.length === 0) {
    return <Spinner mt={20} size="xl" mx="auto" display="block" />;
  }

  if (devicesError || readingsError) {
    return (
      <Alert status="error" borderRadius="lg" mt={4}>
        <AlertIcon />
        Impossible de joindre le backend : {(devicesError || readingsError)?.message}
      </Alert>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6} flexWrap="wrap">
        <Box>
          <Heading size="lg">Maintenant</Heading>
          <Text color="gray.500" fontSize="sm" mt={1}>
            {onlineCount}/{sortedDevices.length} capteur{sortedDevices.length > 1 ? 's' : ''} en ligne
            {lastFetchedAt && ` · maj il y a ${formatAge(lastFetchedAt)}`}
          </Text>
        </Box>
        {readingsLoading && readings.length > 0 && <Spinner size="sm" />}
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
        {sortedDevices.map((d) => (
          <DeviceCard key={d.uid} device={d} reading={readingByDevice.get(d.uid)} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
