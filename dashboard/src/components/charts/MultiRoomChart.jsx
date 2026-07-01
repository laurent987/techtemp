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
  Interaction,
} from 'chart.js';
import { getRelativePosition } from 'chart.js/helpers';
import 'chartjs-adapter-date-fns';
import { fr } from 'date-fns/locale';
import { subDays, format } from 'date-fns';
import { getDeviceReadings } from '../../services/api.service';
import { useOutdoorWeather } from '../../contexts/DataContext';
import { bucketForWindow, buildDatasets, downsampleOutdoor } from './chartData';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale, Filler);

// Mode d'interaction custom : pour CHAQUE courbe visible, un point SYNTHÉTIQUE
// interpolé linéairement à l'instant (x) exact du curseur. Les modes intégrés
// échouent ici car les densités diffèrent trop : 'x' rate l'extérieur (horaire,
// points espacés) et duplique les pièces (mesures ~5 min, plusieurs points par
// pixel) ; 'index' apparie par numéro d'index, incohérent entre 72 pts
// (extérieur) et ~860 (pièces). En interpolant, l'extérieur (horaire) n'est plus
// "décalé" jusqu'à 30 min : le tooltip montre la valeur estimée pile à l'heure
// survolée, sur toutes les courbes. La ligne extérieur étant déjà tracée en
// segments droits entre points, le point interpolé tombe exactement dessus.
Interaction.modes.xInterpolate = function (chart, e, options, useFinalPosition) {
  const pos = getRelativePosition(e, chart);
  const items = [];
  for (const meta of chart.getSortedVisibleDatasetMetas()) {
    // On ignore les bandes min/max (bordure transparente) : rien à interpoler.
    if (chart.data.datasets[meta.index]?.borderColor === 'transparent') continue;

    const pts = [];
    for (let i = 0; i < meta.data.length; i++) {
      const el = meta.data[i];
      if (el.skip) continue;
      const { x, y } = el.getProps(['x', 'y'], useFinalPosition);
      pts.push({ x, y, i });
    }
    if (pts.length === 0) continue;

    let sx;
    let sy;
    let idx;
    if (pos.x <= pts[0].x) {
      ({ x: sx, y: sy, i: idx } = pts[0]); // avant le 1er point → on borne
    } else if (pos.x >= pts[pts.length - 1].x) {
      ({ x: sx, y: sy, i: idx } = pts[pts.length - 1]); // après le dernier → borné
    } else {
      let k = 1;
      while (k < pts.length && pts[k].x < pos.x) k++;
      const a = pts[k - 1];
      const b = pts[k];
      const t = (pos.x - a.x) / (b.x - a.x);
      sx = pos.x;
      sy = a.y + t * (b.y - a.y);
      idx = t < 0.5 ? a.i : b.i; // index du point réel le plus proche (fallback)
    }

    const base = meta.data[idx];
    const element = {
      x: sx,
      y: sy,
      skip: false,
      options: base.options,
      getProps(props) {
        const o = {};
        for (const p of props) o[p] = this[p];
        return o;
      },
      getCenterPoint() {
        return { x: this.x, y: this.y };
      },
      tooltipPosition() {
        return this.getCenterPoint();
      },
      hasValue() {
        return true;
      },
    };
    items.push({ element, datasetIndex: meta.index, index: idx });
  }
  return items;
};

// Redessine un point à la position INTERPOLÉE de chaque courbe active (les
// éléments synthétiques ci-dessus ne sont pas dans meta.data, donc Chart.js ne
// les met pas en surbrillance tout seul). On lit les éléments actifs du tooltip.
const crosshairDots = {
  id: 'crosshairDots',
  afterDraw(chart) {
    const active = chart.tooltip?.getActiveElements?.() || [];
    if (active.length === 0) return;
    const { ctx } = chart;
    ctx.save();
    for (const { element, datasetIndex } of active) {
      const color = chart.data.datasets[datasetIndex]?.borderColor;
      if (!color || color === 'transparent') continue;
      ctx.beginPath();
      ctx.arc(element.x, element.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.restore();
  },
};

// Cadence du rafraîchissement auto du graphe (période courante uniquement).
// Calée sur la fréquence des mesures (~5 min) : rafraîchir plus vite ne ferait
// que re-télécharger la même fenêtre de données à l'identique.
const AUTO_REFRESH_MS = 5 * 60_000;

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

    // showSpinner=false pour les rafraîchissements auto : on met à jour les
    // données en silence, sans faire clignoter l'overlay de chargement.
    const load = (showSpinner) => {
      if (showSpinner) setLoading(true);
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
    };

    load(true);

    // Rafraîchissement auto UNIQUEMENT quand la fenêtre affichée se termine
    // "maintenant" (période courante). Dès qu'on navigue dans le passé (flèches
    // ◀) ou qu'on choisit une période antérieure, toTs devient < maintenant :
    // aucun intervalle n'est créé, donc la navigation historique n'est jamais
    // perturbée. Le re-fetch garde exactement la même fenêtre (il ne touche ni
    // endDate ni windowSize) : la vue ne "saute" pas, seules les données se
    // rafraîchissent. Changer la période (ex. plus de jours) tout en restant
    // sur aujourd'hui relance cet effet et réactive naturellement le timer.
    const isCurrentPeriod = toTs >= Date.now();
    if (!isCurrentPeriod) {
      return () => {
        cancelled = true;
      };
    }
    const id = setInterval(() => load(false), AUTO_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
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
    // Voir le mode custom défini en tête de fichier : une valeur interpolée par
    // courbe à l'instant exact du curseur, robuste aux densités différentes
    // (pièces vs extérieur). intersect:false => le tooltip suit le curseur sans
    // devoir toucher pile un point (utile car pointRadius:0).
    interaction: { mode: 'xInterpolate', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: tickColor,
          filter: (item) => !/ (min|max)$/.test(item.text || ''),
        },
      },
      tooltip: {
        callbacks: {
          // Titre = l'instant réel sous le curseur (pixel x -> temps), pas
          // l'heure d'un point voisin.
          title: (items) => {
            if (items.length === 0) return '';
            const { chart, element } = items[0];
            const ms = chart.scales.x.getValueForPixel(element.x);
            return format(new Date(ms), 'dd/MM/yyyy HH:mm', { locale: fr });
          },
          // Valeur = estimation interpolée (pixel y -> valeur via l'échelle).
          label: (ctx) => {
            const v = ctx.chart.scales.y.getValueForPixel(ctx.element.y);
            const unit = metric === 'temperature' ? '°C' : '%';
            const digits = metric === 'temperature' ? 1 : 0;
            return ` ${ctx.dataset.label} : ${v.toFixed(digits)} ${unit}`;
          },
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
          <Line data={data} options={options} plugins={[crosshairDots]} />
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
