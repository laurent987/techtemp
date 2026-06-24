import { useMemo } from 'react';
import { Box, Flex, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { useDevices, useLatestReadings } from '../contexts/DataContext';
import { useChartSelection } from '../hooks/useChartSelection';
import { ROOM_COLORS } from '../theme';
import SensorCard from '../components/SensorCard';
import MultiRoomChart from '../components/charts/MultiRoomChart';

const ONLINE_MS = 10 * 60 * 1000;
const WARN_MS = 30 * 60 * 1000;

function statusFor(ts) {
  if (!ts) return 'offline';
  const age = Date.now() - new Date(ts).getTime();
  if (age <= ONLINE_MS) return 'online';
  if (age <= WARN_MS) return 'warn';
  return 'offline';
}

function ageLabel(ts) {
  if (!ts) return null;
  const s = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export default function DashboardPage() {
  const { devices, loading, error } = useDevices();
  const { readings } = useLatestReadings();

  const readingByUid = useMemo(() => {
    const m = new Map();
    (readings || []).forEach((r) => m.set(r.deviceUid, r));
    return m;
  }, [readings]);

  const roomUids = useMemo(() => (devices || []).map((d) => d.uid), [devices]);
  const colorForRoom = (uid) => ROOM_COLORS[Math.max(0, roomUids.indexOf(uid)) % ROOM_COLORS.length];
  const nameForRoom = (uid) => {
    const d = (devices || []).find((x) => x.uid === uid);
    return d?.room?.name || d?.room_name || d?.label || uid;
  };

  const { selected, isSelected, toggle, metric, setMetric } = useChartSelection(roomUids);

  if (loading && (!devices || devices.length === 0)) {
    return <Spinner mt={20} size="xl" mx="auto" display="block" />;
  }
  if (error) {
    return (
      <Alert status="error" borderRadius="lg" mt={4}>
        <AlertIcon />
        Impossible de joindre le backend : {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Flex wrap="wrap" gap={3} mb={6}>
        {(devices || []).map((d) => {
          const r = readingByUid.get(d.uid) || {};
          return (
            <SensorCard
              key={d.uid}
              name={nameForRoom(d.uid)}
              temperature={r.temperature}
              humidity={r.humidity}
              status={statusFor(r.ts || d.last_seen_at)}
              ageLabel={ageLabel(r.ts || d.last_seen_at)}
              color={colorForRoom(d.uid)}
              selected={isSelected(d.uid)}
              onToggle={() => toggle(d.uid)}
            />
          );
        })}
      </Flex>

      <MultiRoomChart
        roomUids={selected}
        metric={metric}
        onMetricChange={setMetric}
        colorForRoom={colorForRoom}
        nameForRoom={nameForRoom}
      />
    </Box>
  );
}
