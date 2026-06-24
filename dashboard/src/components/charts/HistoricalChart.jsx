import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Box,
  Flex,
  Spinner,
  Text,
  Select,
  Input,
  Button,
  HStack,
  VStack,
  Badge,
  Collapse,
  useDisclosure,
  useColorModeValue,
  useBreakpointValue,
  Container,
  Heading,
  Icon
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FiBarChart2, FiTrendingUp } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { format, subDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDevices, useHistoricalData, useOutdoorWeather } from '../../contexts/DataContext';
import zoomPlugin from 'chartjs-plugin-zoom';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

/**
 * Composant de graphique historique mobile-first
 * Utilise les hooks existants du DataContext
 */
const HistoricalChart = ({ className = '' }) => {
  // Utiliser les hooks existants du DataContext
  const { devices } = useDevices();

  // Capteur sélectionné. Par défaut on prend celui qui a publié le plus récemment
  // (évite de tomber sur un capteur offline depuis des mois).
  const [selectedDeviceUid, setSelectedDeviceUid] = useState(null);
  const sortedDevices = useMemo(
    () =>
      [...devices].sort((a, b) => {
        const ta = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const tb = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return tb - ta;
      }),
    [devices]
  );

  // États pour les contrôles
  const [selectedDate, setSelectedDate] = useState(() => {
    // Utiliser la date actuelle pour voir les données récentes
    return new Date();
  });
  const [windowSize, setWindowSize] = useState(1); // 1 jour pour commencer
  const [showTemp, setShowTemp] = useState(true);
  const [showHumidity, setShowHumidity] = useState(false);
  const [showMA7d, setShowMA7d] = useState(false);
  const [showMA30d, setShowMA30d] = useState(true);
  const [showMA3m, setShowMA3m] = useState(false);

  // États pour l'analyse technique de base (pas trading avancé)
  const [showBollinger, setShowBollinger] = useState(false);
  const [showSeasonalAnomaly, setShowSeasonalAnomaly] = useState(false);
  const [showComfortZone, setShowComfortZone] = useState(true);
  const [showOutdoor, setShowOutdoor] = useState(true);

  // Option: fixer l'échelle Y pour comparer facilement jour/jour (par défaut activée)
  const [fixedYScale, setFixedYScale] = useState(true);

  const [isExpanded, setIsExpanded] = useState(false);

  // Calculer la période d'affichage : la date sélectionnée est la FIN de la fenêtre
  // (= "les N derniers jours jusqu'au DD/MM"). Plus naturel qu'une fenêtre centrée
  // qui dépasserait dans le futur quand la date choisie est aujourd'hui.
  const displayPeriod = useMemo(() => {
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    const startDate = subDays(endDate, windowSize - 1);
    startDate.setHours(0, 0, 0, 0);

    return {
      startDate,
      endDate,
      centerDate: endDate,
      windowSize
    };
  }, [selectedDate, windowSize]);

  // Utiliser le hook existant pour le premier device (exemple)
  const firstDevice =
    sortedDevices.find((d) => d.uid === selectedDeviceUid) || sortedDevices[0];

  // Utiliser les readings récentes du device au lieu d'historiques Firebase
  const deviceReadings = firstDevice?.readings?.data || firstDevice?.readings || [];

  // Filtrer les readings par période si on a des timestamps
  const filteredReadings = deviceReadings.filter(reading => {
    if (!reading.timestamp) return false;
    const readingDate = new Date(reading.timestamp);
    return readingDate >= displayPeriod.startDate && readingDate <= displayPeriod.endDate;
  });


  // Utiliser les readings filtrées ou toutes les readings si aucune dans la période
  const historicalData = filteredReadings.length > 0 ? filteredReadings : deviceReadings.slice(-50); // Prendre les 50 dernières


  const {
    data: firebaseHistoricalData,
    loading,
    error
  } = useHistoricalData(
    firstDevice?.room_id, // Passer room_id car c'est ce que la fonction Firebase attend !
    displayPeriod.startDate,
    displayPeriod.endDate
  );

  const { data: outdoorData } = useOutdoorWeather(
    displayPeriod.startDate,
    displayPeriod.endDate,
    showOutdoor
  );

  // Debug: afficher les données historiques
  console.log('📊 HistoricalChart - Historical data:', firebaseHistoricalData);
  console.log('📊 HistoricalChart - Loading:', loading);
  console.log('📊 HistoricalChart - Error:', error);

  // Calculer min/max Y. Inclure la température extérieure quand elle est affichée
  // pour éviter que la courbe d'extérieur ne soit clippée par la plage du capteur intérieur.
  const yScaleRange = useMemo(() => {
    const indoorSource = (firebaseHistoricalData && firebaseHistoricalData.length) ? firebaseHistoricalData : deviceReadings;
    const sources = [indoorSource];
    if (showOutdoor && outdoorData && outdoorData.length) {
      sources.push(outdoorData);
    }

    const temps = sources
      .flat()
      .map(d => (d && (d.temperature ?? d.y ?? null)))
      .filter(t => t !== null && t !== undefined && !Number.isNaN(t));
    if (!temps.length) return null;

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const padding = Math.max(0.5, (maxTemp - minTemp) * 0.12); // padding sensible

    return {
      min: Math.floor((minTemp - padding) * 10) / 10,
      max: Math.ceil((maxTemp + padding) * 10) / 10
    };
  }, [firebaseHistoricalData, deviceReadings, showOutdoor, outdoorData]);

  // Récupérer les données historiques quand les paramètres changent
  // SUPPRIMÉ: Code redondant, on utilise maintenant le hook useHistoricalData

  // Calculer les moyennes mobiles
  const calculateMovingAverage = (data, windowDays) => {
    const windowMs = windowDays * 24 * 60 * 60 * 1000; // Convertir jours en millisecondes

    return data.map((point, index) => {
      const currentTime = new Date(point.timestamp).getTime();
      const windowStart = currentTime - windowMs / 2;
      const windowEnd = currentTime + windowMs / 2;

      const windowPoints = data.filter(p => {
        const pointTime = new Date(p.timestamp).getTime();
        return pointTime >= windowStart &&
          pointTime <= windowEnd &&
          p.temperature !== null &&
          p.temperature !== undefined;
      });

      if (windowPoints.length === 0) return null;

      const average = windowPoints.reduce((sum, p) => sum + p.temperature, 0) / windowPoints.length;
      return {
        x: point.timestamp,
        y: Math.round(average * 10) / 10
      };
    }).filter(Boolean);
  };

  // 🎯 ANALYSE TECHNIQUE DE BASE

  // Bandes de Bollinger climatiques (volatilité thermique)
  const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
    const result = { upper: [], middle: [], lower: [] };

    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const temps = slice.map(d => d.temperature).filter(t => t !== null);

      if (temps.length === 0) continue;

      const mean = temps.reduce((sum, t) => sum + t, 0) / temps.length;
      const variance = temps.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / temps.length;
      const std = Math.sqrt(variance);

      const timestamp = data[i].timestamp;
      result.middle.push({ x: timestamp, y: mean });
      result.upper.push({ x: timestamp, y: mean + (stdDev * std) });
      result.lower.push({ x: timestamp, y: mean - (stdDev * std) });
    }

    return result;
  };

  // Zone de confort thermique (20-22°C)
  const getComfortZone = () => ({
    lower: { value: 20, color: 'rgba(76, 175, 80, 0.2)' },
    upper: { value: 22, color: 'rgba(76, 175, 80, 0.2)' }
  });

  // Anomalies saisonnières (température - normale saisonnière)
  const calculateSeasonalAnomalies = (data) => {
    // Calculer la moyenne par jour de l'année (jour julien)
    const dailyNormals = {};

    data.forEach(point => {
      if (point.temperature === null) return;

      const date = new Date(point.timestamp);
      const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

      if (!dailyNormals[dayOfYear]) {
        dailyNormals[dayOfYear] = [];
      }
      dailyNormals[dayOfYear].push(point.temperature);
    });

    // Calculer les moyennes
    Object.keys(dailyNormals).forEach(day => {
      const temps = dailyNormals[day];
      dailyNormals[day] = temps.reduce((sum, t) => sum + t, 0) / temps.length;
    });

    // Calculer les anomalies
    return data.map(point => {
      if (point.temperature === null) return null;

      const date = new Date(point.timestamp);
      const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const normal = dailyNormals[dayOfYear] || point.temperature;

      return {
        x: point.timestamp,
        y: point.temperature - normal
      };
    }).filter(Boolean);
  };

  // Détection mobile
  const isMobile = window.innerWidth < 768;

  // Navigation temporelle
  const navigateTime = (days) => {
    const newDate = addDays(selectedDate, days);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  // Format date pour input
  const formatDateForInput = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // Format période pour affichage mobile
  const formatMobilePeriod = () => {
    if (windowSize === 1) {
      return format(selectedDate, 'EEEE dd MMMM', { locale: fr });
    }
    return `${format(displayPeriod.startDate, 'dd/MM', { locale: fr })} - ${format(displayPeriod.endDate, 'dd/MM', { locale: fr })}`;
  };

  // Options du graphique adaptées mobile + indicateurs trading
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 0,
    interaction: {
      intersect: false,
      mode: 'nearest'
    },
    plugins: {
      legend: {
        display: !isMobile,
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: isMobile ? 10 : 12 }
        }
      },
      tooltip: {
        position: 'nearest',
        caretSize: 10,
        bodyFont: { size: isMobile ? 12 : 14 },
        titleFont: { size: isMobile ? 14 : 16 },
        callbacks: {
          title: function (context) {
            return format(new Date(context[0].parsed.x), 'dd/MM/yyyy HH:mm', { locale: fr });
          },
          label: function (context) {
            const value = context.parsed.y;
            const label = context.dataset.label;

            const unit = label.includes('Temp') || label.includes('MA') ? '°C' : '%';
            return `${label}: ${value?.toFixed(1)}${unit}`;
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x'
        },
        zoom: {
          wheel: {
            enabled: true, // zoom avec la molette
          },
          pinch: {
            enabled: true, // zoom tactile
          },
          mode: 'x'
        },
        limits: {
          x: { min: 'original', max: 'original' },
          y: { min: 'original', max: 'original' }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          // Choisir une unité adaptée à la largeur de fenêtre pour éviter que
          // l'auto-detection ne plotte 30 jours en HH:mm.
          unit: windowSize === 1 ? 'hour' : (windowSize <= 7 ? 'day' : 'day'),
          tooltipFormat: 'dd/MM HH:mm',
          displayFormats: {
            hour: 'HH:mm',
            day: 'dd/MM',
            week: 'dd/MM',
            month: 'MMM yy'
          }
        },
        ticks: {
          maxTicksLimit: isMobile ? (windowSize === 1 ? 6 : 4) : 10,
          font: { size: isMobile ? 10 : 12 },
          source: 'auto'
        },
        // Toujours forcer les bornes au displayPeriod, sinon Chart.js peut zoomer sur
        // un sous-intervalle quand les données sont denses au début et clairsemées à la fin.
        min: displayPeriod.startDate.getTime(),
        max: displayPeriod.endDate.getTime()
      },
      // Axe principal - Température
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Température (°C)',
          color: '#ff6b6b',
          font: { size: isMobile ? 10 : 12 }
        },
        ticks: {
          font: { size: isMobile ? 10 : 12 },
          color: '#ff6b6b'
        },
        grid: {
          drawOnChartArea: true,
          color: 'rgba(255, 107, 107, 0.1)'
        }
        // Appliquer min/max si échelle Y fixée
        , min: (fixedYScale && yScaleRange) ? yScaleRange.min : undefined
        , max: (fixedYScale && yScaleRange) ? yScaleRange.max : undefined
      },
      // Axe secondaire - Humidité
      y1: {
        type: 'linear',
        display: showHumidity,
        position: 'right',
        title: {
          display: true,
          text: 'Humidité (%)',
          color: '#4ecdc4',
          font: { size: isMobile ? 10 : 12 }
        },
        ticks: {
          font: { size: isMobile ? 10 : 12 },
          color: '#4ecdc4'
        },
        grid: {
          drawOnChartArea: false,
        }
      },
      // Axe pour anomalies saisonnières
      y2: {
        type: 'linear',
        display: showSeasonalAnomaly,
        position: 'right',
        title: {
          display: true,
          text: 'Anomalies (°C)',
          color: '#e91e63',
          font: { size: isMobile ? 8 : 10 }
        },
        ticks: {
          font: { size: isMobile ? 8 : 10 },
          color: '#e91e63'
        },
        grid: {
          drawOnChartArea: false,
        },
        // Décaler si humidité active
        offset: showHumidity
      }
    }
  };

  // Préparer les datasets avec les vraies données + indicateurs trading
  const chartData = useMemo(() => {
    if (!firebaseHistoricalData.length) {
      return { datasets: [] };
    }

    const datasets = [];
    const tempData = firebaseHistoricalData
      .filter(d => d.temperature !== null && d.temperature !== undefined)
      .map(d => ({ x: d.timestamp, y: d.temperature, temperature: d.temperature, timestamp: d.timestamp }))
      .sort((a, b) => new Date(a.x) - new Date(b.x));

    // Dataset température extérieure (Open-Meteo, Leuven par défaut)
    if (showOutdoor && outdoorData && outdoorData.length) {
      const outdoorPoints = outdoorData
        .filter(d => d.temperature !== null && d.temperature !== undefined)
        .map(d => ({ x: d.timestamp, y: d.temperature }));
      datasets.push({
        label: 'Extérieur (Leuven)',
        data: outdoorPoints,
        borderColor: '#3182ce',
        backgroundColor: 'rgba(49, 130, 206, 0.06)',
        borderWidth: isMobile ? 2 : 1.5,
        borderDash: [5, 4],
        pointRadius: 0,
        yAxisID: 'y',
        order: 5
      });
    }

    // Dataset température principal
    if (showTemp && tempData.length) {
      datasets.push({
        label: 'Température',
        data: tempData.map(d => ({ x: d.x, y: d.y })),
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: isMobile ? 2 : 1,
        pointRadius: isMobile ? 0 : 1,
        yAxisID: 'y',
        order: 1
      });

      // 🎯 ZONE DE CONFORT (20-22°C)
      if (showComfortZone) {
        const comfortZone = getComfortZone();
        datasets.push({
          label: 'Zone Confort (20-22°C)',
          data: tempData.map(d => ({ x: d.x, y: 21 })), // Ligne centrale
          borderColor: 'rgba(76, 175, 80, 0.6)',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 1,
          pointRadius: 0,
          fill: '+1',
          yAxisID: 'y',
          order: 10
        });

        datasets.push({
          label: 'Limite Confort',
          data: tempData.map(d => ({ x: d.x, y: 20 })), // Limite basse
          borderColor: 'rgba(76, 175, 80, 0.3)',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 1,
          pointRadius: 0,
          yAxisID: 'y',
          order: 11
        });
      }

      // 🎯 BANDES DE BOLLINGER (volatilité thermique)
      if (showBollinger && tempData.length >= 20) {
        const bollinger = calculateBollingerBands(tempData, 20, 2);

        datasets.push({
          label: 'Bollinger Supérieure',
          data: bollinger.upper,
          borderColor: 'rgba(255, 193, 7, 0.8)',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          yAxisID: 'y',
          order: 5
        });

        datasets.push({
          label: 'Bollinger Moyenne',
          data: bollinger.middle,
          borderColor: 'rgba(255, 193, 7, 0.6)',
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'y',
          order: 6
        });

        datasets.push({
          label: 'Bollinger Inférieure',
          data: bollinger.lower,
          borderColor: 'rgba(255, 193, 7, 0.8)',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: '-1',
          yAxisID: 'y',
          order: 7
        });
      }

      // 🎯 ANOMALIES SAISONNIÈRES
      if (showSeasonalAnomaly && tempData.length >= 30) {
        const anomalies = calculateSeasonalAnomalies(tempData);
        datasets.push({
          label: 'Anomalies Saisonnières',
          data: anomalies,
          borderColor: '#e91e63',
          backgroundColor: 'rgba(233, 30, 99, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'y2', // Axe séparé pour les anomalies
          order: 8
        });
      }

      // 🎯 ANOMALIES SAISONNIÈRES
      if (showSeasonalAnomaly && tempData.length >= 30) {
        const anomalies = calculateSeasonalAnomalies(tempData);
        datasets.push({
          label: 'Anomalies Saisonnières',
          data: anomalies,
          borderColor: '#e91e63',
          backgroundColor: 'rgba(233, 30, 99, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'y2', // Axe séparé pour les anomalies
          order: 8
        });
      }

      // Moyennes mobiles climatiques (7 jours, 30 jours, 3 mois)
      if (showMA7d && tempData.length) {
        const ma7d = calculateMovingAverage(tempData, 7);
        datasets.push({
          label: 'MA 7 jours',
          data: ma7d,
          borderColor: '#9c27b0',
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [5, 5],
          yAxisID: 'y',
          order: 3
        });
      }

      if (showMA30d && tempData.length) {
        const ma30d = calculateMovingAverage(tempData, 30);
        datasets.push({
          label: 'MA 30 jours',
          data: ma30d,
          borderColor: '#2196f3',
          borderWidth: 3,
          pointRadius: 0,
          yAxisID: 'y',
          order: 2
        });
      }

      if (showMA3m && tempData.length) {
        const ma3m = calculateMovingAverage(tempData, 90); // 3 mois = 90 jours
        datasets.push({
          label: 'MA 3 mois',
          data: ma3m,
          borderColor: '#4caf50',
          borderWidth: 4,
          pointRadius: 0,
          yAxisID: 'y',
          order: 4
        });
      }
    }

    // Dataset humidité
    if (showHumidity) {
      const humidityData = firebaseHistoricalData
        .filter(d => d.humidity !== null && d.humidity !== undefined)
        .map(d => ({ x: d.timestamp, y: d.humidity }))
        .sort((a, b) => new Date(a.x) - new Date(b.x));

      datasets.push({
        label: 'Humidité',
        data: humidityData,
        borderColor: '#4ecdc4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        borderWidth: isMobile ? 2 : 1,
        pointRadius: isMobile ? 0 : 1,
        yAxisID: 'y1',
        order: 9
      });
    }

    return { datasets };
  }, [firebaseHistoricalData, showTemp, showHumidity, showMA7d, showMA30d, showMA3m,
    showBollinger, showSeasonalAnomaly, showComfortZone, showOutdoor, outdoorData, isMobile]);

  // État pour les contrôles étendus
  const { isOpen, onToggle } = useDisclosure();

  // Hooks de couleur comme la page environnement
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, indigo.50, purple.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );

  const cardBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Container maxW="container.xl" p={0}>
      {/* Header avec gradient comme la page environnement */}
      <Box
        bgGradient={bgGradient}
        py={{ base: 6, md: 8 }}
        px={{ base: 4, md: 6 }}
        borderRadius="xl"
        mb={6}
      >
        <VStack spacing={3} textAlign="center">
          <HStack>
            <Icon as={FiBarChart2} boxSize={8} color="blue.500" />
            <Heading
              size={{ base: "lg", md: "xl" }}
              color={headingColor}
              fontWeight="bold"
            >
              Analyse Climatique Avancée
            </Heading>
          </HStack>
          <Text
            color={textColor}
            fontSize={{ base: "md", md: "lg" }}
            maxW="600px"
          >
            📊 Indicateurs techniques pour l'analyse de votre climat domestique
          </Text>
        </VStack>
      </Box>

      {/* Card principale avec style moderne */}
      <Box
        bg={cardBg}
        borderRadius="xl"
        boxShadow="xl"
        overflow="hidden"
        border="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        {/* Contrôles avec gradient header */}
        <Box
          bgGradient="linear(to-r, blue.500, purple.500)"
          p={4}
        >
          <HStack spacing={3} justify="space-between" align="center">
            <HStack spacing={3}>
              <Select
                value={firstDevice?.uid || ''}
                onChange={e => setSelectedDeviceUid(e.target.value)}
                size="md"
                bg="white"
                color="gray.800"
                borderRadius="lg"
                minW="180px"
                _focus={{ boxShadow: 'lg' }}
              >
                {sortedDevices.map((d) => (
                  <option key={d.uid} value={d.uid}>
                    {d.room_name || d.name || d.uid}
                  </option>
                ))}
              </Select>

              <Select
                value={windowSize}
                onChange={e => setWindowSize(+e.target.value)}
                size="md"
                bg="white"
                color="gray.800"
                borderRadius="lg"
                minW="120px"
                _focus={{ boxShadow: 'lg' }}
              >
                <option value={1}>1 jour</option>
                <option value={3}>3 jours</option>
                <option value={7}>1 semaine</option>
                <option value={30}>1 mois</option>
              </Select>

              <Input
                type="date"
                value={formatDateForInput(selectedDate)}
                onChange={e => setSelectedDate(new Date(e.target.value))}
                size="md"
                bg="white"
                color="gray.800"
                borderRadius="lg"
                _focus={{ boxShadow: 'lg' }}
              />

              {/* fixedYScale moved to Paramètres Graphique section inside 'Plus' */}
            </HStack>

            <Button
              onClick={onToggle}
              colorScheme="whiteAlpha"
              variant="solid"
              size="md"
              rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              borderRadius="lg"
              _hover={{ bg: 'whiteAlpha.300' }}
            >
              <Icon as={FiTrendingUp} mr={2} />
              Plus
            </Button>
          </HStack>

          {/* Contrôles étendus avec style moderne */}
          <Collapse in={isOpen} animateOpacity>
            <VStack spacing={4} align="stretch" mt={4} pt={4} borderTop="1px" borderColor="whiteAlpha.300">
              {/* Métriques avec badges stylés */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="white" mb={3}>
                  <Icon as={FiBarChart2} mr={2} />
                  Métriques:
                </Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Badge
                    variant={showTemp ? "solid" : "outline"}
                    colorScheme="red"
                    cursor="pointer"
                    onClick={() => setShowTemp(!showTemp)}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    bg={showTemp ? "red.500" : "whiteAlpha.200"}
                    color={showTemp ? "white" : "white"}
                    border="2px"
                    borderColor={showTemp ? "red.500" : "whiteAlpha.400"}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    🌡️ Température
                  </Badge>
                  <Badge
                    variant={showHumidity ? "solid" : "outline"}
                    colorScheme="teal"
                    cursor="pointer"
                    onClick={() => setShowHumidity(!showHumidity)}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    bg={showHumidity ? "teal.500" : "whiteAlpha.200"}
                    color={showHumidity ? "white" : "white"}
                    border="2px"
                    borderColor={showHumidity ? "teal.500" : "whiteAlpha.400"}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    💧 Humidité
                  </Badge>
                </HStack>
              </Box>

              {/* Moyennes mobiles avec badges stylés */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="white" mb={3}>
                  <Icon as={FiTrendingUp} mr={2} />
                  Moyennes Climatiques:
                </Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Badge
                    variant={showMA7d ? "solid" : "outline"}
                    colorScheme="purple"
                    cursor="pointer"
                    onClick={() => setShowMA7d(!showMA7d)}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    bg={showMA7d ? "purple.500" : "whiteAlpha.200"}
                    color="white"
                    border="2px"
                    borderColor={showMA7d ? "purple.500" : "whiteAlpha.400"}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    📅 7 jours
                  </Badge>
                  <Badge
                    variant={showMA30d ? "solid" : "outline"}
                    colorScheme="blue"
                    cursor="pointer"
                    onClick={() => setShowMA30d(!showMA30d)}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    bg={showMA30d ? "blue.500" : "whiteAlpha.200"}
                    color="white"
                    border="2px"
                    borderColor={showMA30d ? "blue.500" : "whiteAlpha.400"}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    📊 30 jours
                  </Badge>
                  <Badge
                    variant={showMA3m ? "solid" : "outline"}
                    colorScheme="green"
                    cursor="pointer"
                    onClick={() => setShowMA3m(!showMA3m)}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    bg={showMA3m ? "green.500" : "whiteAlpha.200"}
                    color="white"
                    border="2px"
                    borderColor={showMA3m ? "green.500" : "whiteAlpha.400"}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    📈 3 mois
                  </Badge>
                </HStack>
              </Box>

              {/* Analyse technique de base */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="white" mb={3}>
                  📊 Analyse Technique:
                </Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Badge
                    variant={showOutdoor ? "solid" : "outline"}
                    colorScheme="blue"
                    cursor="pointer"
                    onClick={() => setShowOutdoor(!showOutdoor)}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    bg={showOutdoor ? "blue.500" : "whiteAlpha.200"}
                    color="white"
                    border="2px"
                    borderColor={showOutdoor ? "blue.500" : "whiteAlpha.400"}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    🌤️ Extérieur (Leuven)
                  </Badge>
                  <Badge
                    variant={showComfortZone ? "solid" : "outline"}
                    colorScheme="green"
                    cursor="pointer"
                    onClick={() => setShowComfortZone(!showComfortZone)}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    bg={showComfortZone ? "green.500" : "whiteAlpha.200"}
                    color="white"
                    border="2px"
                    borderColor={showComfortZone ? "green.500" : "whiteAlpha.400"}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    🏠 Zone Confort
                  </Badge>
                  <Badge
                    variant={showBollinger ? "solid" : "outline"}
                    colorScheme="yellow"
                    cursor="pointer"
                    onClick={() => setShowBollinger(!showBollinger)}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    bg={showBollinger ? "yellow.500" : "whiteAlpha.200"}
                    color={showBollinger ? "black" : "white"}
                    border="2px"
                    borderColor={showBollinger ? "yellow.500" : "whiteAlpha.400"}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    📈 Bollinger
                  </Badge>
                  <Badge
                    variant={showSeasonalAnomaly ? "solid" : "outline"}
                    colorScheme="pink"
                    cursor="pointer"
                    onClick={() => setShowSeasonalAnomaly(!showSeasonalAnomaly)}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    bg={showSeasonalAnomaly ? "pink.500" : "whiteAlpha.200"}
                    color="white"
                    border="2px"
                    borderColor={showSeasonalAnomaly ? "pink.500" : "whiteAlpha.400"}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    🌡️ Anomalies
                  </Badge>
                </HStack>
              </Box>

              {/* Paramètres Graphique - emplacement pour contrôles liés à l'affichage du graphe */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="white" mb={3}>
                  ⚙️ Paramètres Graphique
                </Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Badge
                    variant={fixedYScale ? "solid" : "outline"}
                    colorScheme="gray"
                    cursor="pointer"
                    onClick={() => setFixedYScale(s => !s)}
                    px={3}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    bg={fixedYScale ? "gray.700" : "whiteAlpha.200"}
                    color="white"
                    border="2px"
                    borderColor={fixedYScale ? "gray.700" : "whiteAlpha.400"}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                  >
                    📏 Échelle Y fixe
                  </Badge>
                </HStack>
              </Box>
            </VStack>
          </Collapse>
        </Box>

        {/* Navigation temporelle moderne */}
        <Flex
          align="center"
          justify="space-between"
          p={6}
          bg={cardBg}
          borderBottom="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <Button
            onClick={() => navigateTime(-1)}
            variant="outline"
            size="lg"
            leftIcon={<Text fontSize="lg">←</Text>}
            borderRadius="xl"
            colorScheme="blue"
            _hover={{ bg: 'blue.50', transform: 'translateY(-2px)' }}
            transition="all 0.2s"
          >
            Précédent
          </Button>

          <VStack spacing={1}>
            <Text
              fontWeight="bold"
              color={headingColor}
              fontSize="lg"
            >
              {formatMobilePeriod()}
            </Text>
            <Text fontSize="sm" color={textColor}>
              {windowSize === 1 ? 'Jour' : windowSize < 7 ? 'Jours' : windowSize < 30 ? 'Semaine' : 'Mois'}
            </Text>
          </VStack>

          <Button
            onClick={() => navigateTime(1)}
            isDisabled={addDays(selectedDate, 1) > new Date()}
            variant="outline"
            size="lg"
            rightIcon={<Text fontSize="lg">→</Text>}
            borderRadius="xl"
            colorScheme="blue"
            _hover={{ bg: 'blue.50', transform: 'translateY(-2px)' }}
            _disabled={{ opacity: 0.4 }}
            transition="all 0.2s"
          >
            Suivant
          </Button>
        </Flex>

        {/* Zone du graphique avec style moderne */}
        <Box
          p={6}
          bg={cardBg}
          h="400px"
          position="relative"
        >
          {/* Pas de devices disponibles */}
          {!devices || devices.length === 0 ? (
            <VStack spacing={4} justify="center" h="100%">
              <Text fontSize="4xl" opacity={0.7}>🏠</Text>
              <Text color={textColor} fontSize="lg" fontWeight="medium">
                Aucun capteur disponible
              </Text>
              <Text fontSize="sm" color={textColor} opacity={0.7} textAlign="center" maxW="320px">
                Vérifiez que vos capteurs sont connectés et configurés
              </Text>
            </VStack>
          ) : !firstDevice ? (
            <VStack spacing={4} justify="center" h="100%">
              <Text fontSize="4xl" opacity={0.7}>🔍</Text>
              <Text color={textColor} fontSize="lg" fontWeight="medium">
                Aucun capteur sélectionné
              </Text>
              <Text fontSize="sm" color={textColor} opacity={0.7} textAlign="center" maxW="280px">
                Sélectionnez un capteur pour afficher les données
              </Text>
            </VStack>
          ) : loading ? (
            <VStack spacing={4} justify="center" h="100%">
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text color={textColor} fontSize="lg" fontWeight="medium">
                Chargement des données historiques...
              </Text>
              <Text fontSize="sm" color={textColor} opacity={0.7}>
                Capteur: {firstDevice.name || firstDevice.id}
              </Text>
            </VStack>
          ) : error ? (
            <VStack spacing={4} justify="center" h="100%">
              <Icon as={FiTrendingUp} boxSize={12} color="gray.400" />
              <Text color="red.500" fontSize="lg" fontWeight="medium">
                ⚠️ Erreur: {error}
              </Text>
              <Button
                onClick={() => setSelectedDate(new Date(selectedDate))}
                colorScheme="blue"
                variant="outline"
                borderRadius="xl"
              >
                Réessayer
              </Button>
            </VStack>
          ) : chartData.datasets.length === 0 ? (
            <VStack spacing={4} justify="center" h="100%">
              <Text fontSize="4xl" opacity={0.7}>📊</Text>
              <Text color={textColor} fontSize="lg" fontWeight="medium">
                Aucune donnée disponible pour cette période
              </Text>
              <Text fontSize="sm" color={textColor} opacity={0.7} textAlign="center" maxW="320px">
                Capteur: {firstDevice.name || firstDevice.id} - Sélectionnez une autre période
              </Text>
            </VStack>
          ) : (
            <Box h="100%" position="relative">
              {/* Graphique principal */}
              <Box h="100%">
                <Line data={chartData} options={chartOptions} id="climate-chart" />
              </Box>

              {/* Instructions de zoom discrètes */}
              {/* <Box
                position="absolute"
                bottom={2}
                left="50%"
                transform="translateX(-50%)"
                fontSize="xs"
                color="gray.500"
                bg="whiteAlpha.800"
                px={3}
                py={1}
                borderRadius="md"
                opacity={0.7}
                _hover={{ opacity: 1 }}
              >
                {isMobile ? '📱 Pincement pour zoomer' : '🖱️ Molette pour zoomer, glisser pour naviguer'}
              </Box> */}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default HistoricalChart;