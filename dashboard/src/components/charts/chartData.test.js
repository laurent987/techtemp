import { bucketForWindow, buildDatasets } from './chartData';

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
