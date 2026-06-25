import { useMemo } from 'react';
import { Box, Flex, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { useDevices, useLatestReadings, useCurrentOutdoor, useTodayStats } from '../contexts/DataContext';
import { useChartSelection } from '../hooks/useChartSelection';
import { ROOM_COLORS } from '../theme';
import { dewPoint, humidex, comfortColor, comfortLabel } from '../lib/comfort';
import SensorCard from '../components/SensorCard';
import MultiRoomChart from '../components/charts/MultiRoomChart';

export const OUTDOOR_UID = '__exterieur__';
const OUTDOOR_COLOR = '#94a3b8';
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

// One card: pulls today's min/max and computes the derived (humidex/dew point) values.
function RoomVignette({ uid, name, temperature, humidity, status, ageLabel: age, color, selected, onToggle }) {
  const stats = useTodayStats(uid);
  const hasReading = temperature != null && humidity != null;
  const hx = hasReading ? humidex(temperature, humidity) : null;
  return (
    <SensorCard
      name={name}
      temperature={temperature}
      humidity={humidity}
      status={status}
      ageLabel={age}
      color={color}
      selected={selected}
      onToggle={onToggle}
      humidex={hx}
      humidexColor={hx != null ? comfortColor(hx) : undefined}
      humidexLabel={hx != null ? comfortLabel(hx) : ''}
      dewPoint={hasReading ? dewPoint(temperature, humidity) : null}
      todayTemp={stats ? { min: stats.tempMin, max: stats.tempMax } : null}
      todayHum={stats ? { min: stats.humMin, max: stats.humMax } : null}
    />
  );
}

export default function DashboardPage() {
  const { devices, loading, error } = useDevices();
  const { readings } = useLatestReadings();
  const { data: outdoor } = useCurrentOutdoor();

  const readingByUid = useMemo(() => {
    const m = new Map();
    (readings || []).forEach((r) => m.set(r.deviceUid, r));
    return m;
  }, [readings]);

  const roomUids = useMemo(() => (devices || []).map((d) => d.uid), [devices]);
  const allUids = useMemo(() => [OUTDOOR_UID, ...roomUids], [roomUids]);
  const colorForRoom = (uid) => ROOM_COLORS[Math.max(0, roomUids.indexOf(uid)) % ROOM_COLORS.length];
  const nameForRoom = (uid) => {
    const d = (devices || []).find((x) => x.uid === uid);
    return d?.room?.name || d?.room_name || d?.label || uid;
  };

  const { selected, isSelected, toggle, metric, setMetric } = useChartSelection(allUids);

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
        <RoomVignette
          uid={OUTDOOR_UID}
          name="Extérieur"
          temperature={outdoor?.temperature}
          humidity={outdoor?.humidity}
          status="online"
          ageLabel={null}
          color={OUTDOOR_COLOR}
          selected={isSelected(OUTDOOR_UID)}
          onToggle={() => toggle(OUTDOOR_UID)}
        />
        {(devices || []).map((d) => {
          const r = readingByUid.get(d.uid) || {};
          return (
            <RoomVignette
              key={d.uid}
              uid={d.uid}
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
        roomUids={selected.filter((u) => u !== OUTDOOR_UID)}
        showOutdoor={isSelected(OUTDOOR_UID)}
        metric={metric}
        onMetricChange={setMetric}
        colorForRoom={colorForRoom}
        nameForRoom={nameForRoom}
      />
    </Box>
  );
}
