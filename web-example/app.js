/* global React, ReactDOM, chakra */

const { useEffect, useMemo, useState } = React;
const {
  ChakraProvider,
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Stack,
  HStack,
  Tag,
  Button,
  Container,
  Spinner,
  useToast,
  ColorModeScript,
  extendTheme,
} = chakra;

const api = {
  async getDevices() {
    const res = await fetch('/api/v1/devices');
    if (!res.ok) throw new Error('Failed to fetch devices');
    const json = await res.json();
    return json.data || [];
  },
  async getLatestReadings() {
    const res = await fetch('/api/v1/readings/latest');
    if (!res.ok) throw new Error('Failed to fetch readings');
    const json = await res.json();
    return json.data || [];
  },
};

function formatTs(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

function ageFrom(ts) {
  const d = new Date(ts).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.floor((now - d) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

function DeviceCard({ d }) {
  return (
    React.createElement(Box, { borderWidth: '1px', borderRadius: 'lg', p: 4 },
      React.createElement(HStack, { justify: 'space-between', mb: 2 },
        React.createElement(Heading, { size: 'md' }, d.label || d.uid),
        React.createElement(Tag, { colorScheme: d.room_id ? 'blue' : 'gray' }, d.room_id ? `room:${d.room_id}` : 'no-room')
      ),
      React.createElement(Text, { color: 'gray.500', fontSize: 'sm' }, `UID: ${d.uid}`),
      d.last_seen_at && React.createElement(Text, { color: 'gray.500', fontSize: 'sm', mt: 1 }, `vu ${ageFrom(d.last_seen_at)} • ${formatTs(d.last_seen_at)}`)
    )
  );
}

function ReadingCard({ r }) {
  const tempColor = r.temperature >= 27 ? 'red' : r.temperature <= 18 ? 'cyan' : 'green';
  return (
    React.createElement(Box, { borderWidth: '1px', borderRadius: 'lg', p: 4 },
      React.createElement(HStack, { justify: 'space-between', mb: 2 },
        React.createElement(Heading, { size: 'sm' }, r.device_id),
        React.createElement(Badge, { colorScheme: 'purple' }, ageFrom(r.ts))
      ),
      React.createElement(Stack, { direction: 'row', spacing: 8 },
        React.createElement(Stat, null,
          React.createElement(StatLabel, null, 'Température'),
          React.createElement(StatNumber, { color: `${tempColor}.400` }, `${r.temperature.toFixed(1)} °C`),
          React.createElement(StatHelpText, null, formatTs(r.ts))
        ),
        React.createElement(Stat, null,
          React.createElement(StatLabel, null, 'Humidité'),
          React.createElement(StatNumber, null, `${r.humidity.toFixed(1)} %`)
        )
      )
    )
  );
}

function App() {
  const [devices, setDevices] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const toast = useToast();

  const refresh = async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([
        api.getDevices(),
        api.getLatestReadings(),
      ]);
      setDevices(d);
      setReadings(r);
      setLastRefresh(new Date());
    } catch (e) {
      toast({ title: 'Erreur de chargement', description: e.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    React.createElement(ChakraProvider, { theme: extendTheme({}) },
      React.createElement(ColorModeScript, null),
      React.createElement(Container, { maxW: '6xl', py: 6 },
        React.createElement(HStack, { justify: 'space-between', mb: 4 },
          React.createElement(Heading, { size: 'lg' }, 'TechTemp'),
          React.createElement(HStack, { spacing: 3 },
            lastRefresh && React.createElement(Text, { color: 'gray.500', fontSize: 'sm' }, `MAJ: ${lastRefresh.toLocaleTimeString()}`),
            React.createElement(Button, { onClick: refresh, isLoading: loading }, 'Rafraîchir')
          )
        ),

        React.createElement(Box, { mb: 6 },
          React.createElement(Heading, { size: 'md', mb: 3 }, 'Appareils'),
          loading && devices.length === 0
            ? React.createElement(Spinner, null)
            : devices.length === 0
              ? React.createElement(Text, { color: 'gray.500' }, 'Aucun appareil détecté')
              : React.createElement(SimpleGrid, { columns: { base: 1, sm: 2, md: 3 }, spacing: 4 },
                  devices.map((d) => React.createElement(DeviceCard, { key: d.uid, d }))
                )
        ),

        React.createElement(Box, null,
          React.createElement(Heading, { size: 'md', mb: 3 }, 'Dernières mesures'),
          loading && readings.length === 0
            ? React.createElement(Spinner, null)
            : readings.length === 0
              ? React.createElement(Text, { color: 'gray.500' }, 'Aucune donnée disponible')
              : React.createElement(SimpleGrid, { columns: { base: 1, sm: 2, md: 3 }, spacing: 4 },
                  readings.map((r) => React.createElement(ReadingCard, { key: `${r.device_id}-${r.ts}`, r }))
                )
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));

