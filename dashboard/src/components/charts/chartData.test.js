import { bucketForWindow, buildDatasets, downsampleOutdoor } from './chartData';

test('bucketForWindow maps period length to granularity', () => {
  expect(bucketForWindow(1)).toBe('raw');
  expect(bucketForWindow(7)).toBe('raw');
  expect(bucketForWindow(30)).toBe('hour');
  expect(bucketForWindow(90)).toBe('day');
  expect(bucketForWindow(365)).toBe('day');
});

const series = {
  zolder: [{ timestamp: 1, temperature: 22, temperatureMin: 20, temperatureMax: 24, humidity: 50, humidityMin: 45, humidityMax: 55 }],
  bureau: [{ timestamp: 1, temperature: 25, humidity: 60 }],
};
const opts = { seriesByUid: series, metric: 'temperature', colorForRoom: () => '#22d3ee', nameForRoom: (u) => u };

test('one aggregated room -> avg + min + max (band) = 3 datasets', () => {
  const ds = buildDatasets({ ...opts, roomUids: ['zolder'], bucket: 'day' });
  expect(ds).toHaveLength(3);
});

test('two rooms -> averages only (no band) = 2 datasets', () => {
  const ds = buildDatasets({ ...opts, roomUids: ['zolder', 'bureau'], bucket: 'day' });
  expect(ds).toHaveLength(2);
});

test('raw bucket -> no band even with one room', () => {
  const ds = buildDatasets({ ...opts, roomUids: ['zolder'], bucket: 'raw' });
  expect(ds).toHaveLength(1);
});

test('downsampleOutdoor averages per day when bucket=day', () => {
  const rows = [
    { timestamp: Date.parse('2026-06-01T08:00:00Z'), temperature: 10, humidity: 80 },
    { timestamp: Date.parse('2026-06-01T20:00:00Z'), temperature: 20, humidity: 60 },
    { timestamp: Date.parse('2026-06-02T09:00:00Z'), temperature: 15, humidity: 50 },
  ];
  const out = downsampleOutdoor(rows, 'day');
  expect(out).toHaveLength(2);
  expect(out[0].temperature).toBe(15); // (10+20)/2
  expect(out[0].humidity).toBe(70);
});

test('downsampleOutdoor leaves rows unchanged for raw/hour', () => {
  const rows = [{ timestamp: 1, temperature: 10, humidity: 80 }];
  expect(downsampleOutdoor(rows, 'raw')).toBe(rows);
  expect(downsampleOutdoor(rows, 'hour')).toBe(rows);
});

test('buildDatasets prepends an "Extérieur" series when outdoorRows given', () => {
  const ds = buildDatasets({
    roomUids: ['zolder'],
    seriesByUid: { zolder: [{ timestamp: 1, temperature: 22, temperatureMin: 20, temperatureMax: 24 }] },
    metric: 'temperature', bucket: 'day',
    colorForRoom: () => '#22d3ee', nameForRoom: (u) => u,
    outdoorRows: [{ timestamp: 1, temperature: 12, humidity: 70 }],
  });
  expect(ds).toHaveLength(4); // 3 (avg+min+max band) + 1 outdoor
  expect(ds.some((d) => d.label === 'Extérieur')).toBe(true);
});

test('buildDatasets without outdoorRows is unchanged (1 raw room -> 1 dataset)', () => {
  const ds = buildDatasets({
    roomUids: ['zolder'],
    seriesByUid: { zolder: [{ timestamp: 1, temperature: 22 }] },
    metric: 'temperature', bucket: 'raw',
    colorForRoom: () => '#22d3ee', nameForRoom: (u) => u,
  });
  expect(ds).toHaveLength(1);
});
