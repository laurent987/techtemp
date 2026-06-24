import { useState } from 'react';
import { Box, Flex, Text, Grid, GridItem, IconButton } from '@chakra-ui/react';
import { InfoOutlineIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

const statusLabel = { online: 'En ligne', warn: 'Retard', offline: 'Hors ligne' };
const statusColor = { online: '#22c55e', warn: '#f59e0b', offline: '#ef4444' };

function Face({ children, hidden, testid, back = false }) {
  return (
    <Box
      data-testid={testid}
      aria-hidden={hidden ? 'true' : 'false'}
      position="absolute"
      inset="0"
      p={4}
      bg="app.surface"
      borderRadius="14px"
      sx={{ backfaceVisibility: 'hidden', transform: back ? 'rotateY(180deg)' : 'none' }}
      display="flex"
      flexDirection="column"
    >
      {children}
    </Box>
  );
}

function Row({ label, value, color, last }) {
  return (
    <Flex
      justify="space-between"
      fontSize="12.5px"
      py="4px"
      borderBottomWidth={last ? 0 : '1px'}
      borderColor="app.border"
    >
      <Text color="app.textMuted">{label}</Text>
      <Text color={color || 'app.text'} fontWeight={color ? '600' : '400'}>{value}</Text>
    </Flex>
  );
}

export default function SensorCard({
  name,
  temperature,
  humidity,
  status = 'online',
  ageLabel,
  color = '#22d3ee',
  selected = false,
  onToggle,
  humidex,
  humidexColor = '#22c55e',
  humidexLabel = '',
  dewPoint,
  todayTemp = null,
  todayHum = null,
}) {
  const [flipped, setFlipped] = useState(false);
  const stop = (e) => e.stopPropagation();

  return (
    <Box
      onClick={onToggle}
      cursor="pointer"
      position="relative"
      w="300px"
      h="185px"
      sx={{ perspective: '1200px' }}
      borderRadius="14px"
      borderWidth={selected ? '2px' : '1px'}
      borderColor={selected ? color : 'app.border'}
      boxShadow={selected ? `0 0 0 3px ${color}26` : 'sm'}
      transition="border-color .15s, box-shadow .15s"
    >
      <motion.div
        style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* FRONT */}
        <Face hidden={flipped} testid="card-front">
          <Flex justify="space-between" align="flex-start">
            <Text fontWeight="600" fontSize="15px" color="app.text">
              <Box
                as="span"
                aria-label={statusLabel[status]}
                display="inline-block"
                w="9px"
                h="9px"
                borderRadius="full"
                bg={statusColor[status]}
                mr={2}
              />
              {name}
            </Text>
            <IconButton
              aria-label="Voir les détails"
              icon={<InfoOutlineIcon />}
              size="xs"
              variant="ghost"
              color="app.textMuted"
              onClick={(e) => {
                stop(e);
                setFlipped(true);
              }}
            />
          </Flex>
          <Grid templateColumns="1fr 1fr" gap={3} my="auto">
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
            <Text color="app.textMuted" fontSize="11px" textAlign="right">
              {ageLabel}
            </Text>
          )}
        </Face>

        {/* BACK */}
        <Face hidden={!flipped} testid="card-back" back>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontWeight="600" fontSize="14px" color="app.text">{name} · détails</Text>
            <IconButton
              aria-label="Retour"
              icon={<ArrowBackIcon />}
              size="xs"
              variant="ghost"
              color="app.textMuted"
              onClick={(e) => {
                stop(e);
                setFlipped(false);
              }}
            />
          </Flex>
          <Row label="🥵 Ressenti" value={humidex != null ? `${Math.round(humidex)}° · ${humidexLabel}` : '—'} color={humidexColor} />
          <Row label="💧 Point de rosée" value={dewPoint != null ? `${dewPoint.toFixed(1)}°` : '—'} />
          <Row label="🌡️ Aujourd'hui" value={todayTemp ? `${Math.round(todayTemp.min)}–${Math.round(todayTemp.max)}°` : '—'} />
          <Row label="💧 Aujourd'hui" value={todayHum ? `${Math.round(todayHum.min)}–${Math.round(todayHum.max)}%` : '—'} last />
        </Face>
      </motion.div>
    </Box>
  );
}
