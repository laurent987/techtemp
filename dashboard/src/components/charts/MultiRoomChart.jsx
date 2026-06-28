import { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Box, Flex, ButtonGroup, Button, HStack, IconButton, Text, Spinner, Select, useColorModeValue } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { fr } from 'date-fns/locale';
import { subDays, format } from 'date-fns';
import { getDeviceReadings } from '../../services/api.service';
import { useOutdoorWeather } from '../../contexts/DataContext';
import { bucketForWindow, buildDatasets, downsampleOutdoor } from './chartData';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale, Filler);

const PERIODS = [
  { d: 1, label: '1 jour' },
  { d: 3, label: '3 jours' },
  { d: 7, label: '1 semaine' },
  { d: 30, label: '1 mois' },
  { d: 90, label: '3 mois' },
  { d: 180, label: '6 mois' },
  { d: 365, label: '1 an' },
];

export default function MultiRoomChart({
  roomUids = [],
  metric = 'temperature',
  onMetricChange = () => {},
  colorForRoom = () => '#22d3ee',
  nameForRoom = (u) => u,
  showOutdoor = true,
}) {
  const [windowSize, setWindowSize] = useState(3);
  const [endDate, setEndDate] = useState(() => new Date());
  const [seriesByUid, setSeriesByUid] = useState({});
  const [loading, setLoading] = useState(false);

  const period = useMemo(() => {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const start = subDays(end, windowSize - 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, [endDate, windowSize]);

  const bucket = bucketForWindow(windowSize);
  const { data: outdoorRaw } = useOutdoorWeather(period.start, period.end, showOutdoor);
  const outdoorRows = showOutdoor ? downsampleOutdoor(outdoorRaw, bucket) : [];
  const key = roomUids.join(',');
  const fromTs = period.start.getTime();
  const toTs = period.end.getTime();

  useEffect(() => {
    if (roomUids.length === 0) {
      setSeriesByUid({});
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(
      roomUids.map((uid) =>
        getDeviceReadings(uid, { from: period.start, to: period.end, bucket })
          .then((rows) => [uid, rows])
          .catch(() => [uid, []])
      )
    )
      .then((entries) => {
        if (!cancelled) setSeriesByUid(Object.fromEntries(entries));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fromTs, toTs, bucket]);

  const gridColor = useColorModeValue('#e2e8f0', '#293548');
  const tickColor = useColorModeValue('#64748b', '#94a3b8');

  const data = {
    datasets: buildDatasets({ roomUids, seriesByUid, metric, bucket, colorForRoom, nameForRoom, outdoorRows }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: tickColor,
          filter: (item) => !/ (min|max)$/.test(item.text || ''),
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        adapters: { date: { locale: fr } },
        time: { tooltipFormat: 'dd/MM/yyyy HH:mm' },
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          // Marque les débuts de jour (minuit) comme ticks "major". autoSkip de
          // Chart.js préserve toujours les major : le tick qui porte la date ne peut
          // plus être supprimé, donc la date reste visible même si minuit tombe
          // pile sur un tick éliminé pour cause de densité.
          major: { enabled: true },
          // Ancre les ticks dans le temps : la date n'apparaît qu'au changement de
          // jour/mois, sinon on ne montre que l'heure. S'adapte à la granularité
          // (heures pour 1-3 j, jours pour semaine/mois, mois pour 3 mois-1 an).
          callback: function (value, index, ticks) {
            const d = new Date(value);
            const stepMs = ticks.length > 1
              ? Math.abs(ticks[1].value - ticks[0].value)
              : 0;
            const day = 24 * 60 * 60 * 1000;

            // Granularité mensuelle ou plus : mois + année
            if (stepMs >= 28 * day) {
              return format(d, 'MMM yy', { locale: fr });
            }
            // Granularité journalière : jour/mois
            if (stepMs >= day) {
              return format(d, 'dd/MM', { locale: fr });
            }
            // Granularité horaire : heure, + date (2e ligne) au premier tick d'un nouveau jour
            const hhmm = format(d, 'HH:mm', { locale: fr });
            const prev = index > 0 ? new Date(ticks[index - 1].value) : null;
            const isNewDay = !prev
              || format(prev, 'yyyy-MM-dd') !== format(d, 'yyyy-MM-dd');
            return isNewDay ? [hhmm, format(d, 'dd/MM', { locale: fr })] : hhmm;
          },
        },
      },
      y: {
        grid: {
          color: gridColor,
          // Lignes des dizaines un peu plus épaisses pour mieux lire les valeurs
          lineWidth: (ctx) => (ctx.tick?.value % 10 === 0 ? 2.8 : 1),
        },
        ticks: { color: tickColor },
        title: {
          display: true,
          text: metric === 'temperature' ? 'Température (°C)' : 'Humidité (%)',
          color: tickColor,
        },
      },
    },
  };

  return (
    <Box bg="app.surface" borderWidth="1px" borderColor="app.border" borderRadius="12px" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={2} mb={3}>
        <HStack spacing={2} wrap="wrap">
          <ButtonGroup isAttached size="xs">
            <Button
              onClick={() => onMetricChange('temperature')}
              colorScheme={metric === 'temperature' ? 'cyan' : 'gray'}
              variant={metric === 'temperature' ? 'solid' : 'outline'}
            >
              🌡️ Température
            </Button>
            <Button
              onClick={() => onMetricChange('humidity')}
              colorScheme={metric === 'humidity' ? 'cyan' : 'gray'}
              variant={metric === 'humidity' ? 'solid' : 'outline'}
            >
              💧 Humidité
            </Button>
          </ButtonGroup>
          <Select
            aria-label="Période"
            size="xs"
            width="auto"
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
          >
            {PERIODS.map((p) => (
              <option key={p.d} value={p.d}>{p.label}</option>
            ))}
          </Select>
        </HStack>
        <HStack spacing={1}>
          <IconButton
            aria-label="Période précédente"
            size="xs"
            variant="ghost"
            icon={<ChevronLeftIcon />}
            onClick={() => setEndDate((d) => subDays(d, windowSize))}
          />
          <Text fontSize="xs" color="app.textMuted">
            {format(period.start, 'd MMM', { locale: fr })} – {format(period.end, 'd MMM', { locale: fr })}
          </Text>
          <IconButton
            aria-label="Période suivante"
            size="xs"
            variant="ghost"
            icon={<ChevronRightIcon />}
            onClick={() =>
              setEndDate((d) => {
                const n = new Date(d);
                n.setDate(n.getDate() + windowSize);
                return n > new Date() ? new Date() : n;
              })
            }
          />
        </HStack>
      </Flex>
      <Box h="300px" position="relative">
        {roomUids.length === 0 ? (
          <Flex h="100%" align="center" justify="center">
            <Text color="app.textMuted" fontSize="sm">
              Sélectionne au moins une pièce ci-dessus pour afficher le graphe.
            </Text>
          </Flex>
        ) : (
          <Line data={data} options={options} />
        )}
        {loading && (
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            align="center"
            justify="center"
            bg="app.surface"
            opacity={0.65}
          >
            <Spinner size="lg" color="app.accent" thickness="3px" />
          </Flex>
        )}
      </Box>
    </Box>
  );
}
