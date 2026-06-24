export function bucketForWindow(days) {
  if (days <= 7) return 'raw';
  if (days <= 31) return 'hour';
  return 'day';
}

export function downsampleOutdoor(rows, bucket) {
  if (bucket !== 'day' || !rows || rows.length === 0) return rows;
  const byDay = new Map();
  for (const r of rows) {
    const day = new Date(r.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(r);
  }
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return [...byDay.values()]
    .map((group) => ({
      timestamp: Math.min(...group.map((g) => g.timestamp)),
      temperature: avg(group.map((g) => g.temperature)),
      humidity: avg(group.map((g) => g.humidity)),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function buildDatasets({ roomUids, seriesByUid, metric, bucket, colorForRoom, nameForRoom, outdoorRows = [] }) {
  const showBand = bucket !== 'raw' && roomUids.length === 1;
  const minKey = metric === 'temperature' ? 'temperatureMin' : 'humidityMin';
  const maxKey = metric === 'temperature' ? 'temperatureMax' : 'humidityMax';
  const datasets = [];

  for (const uid of roomUids) {
    const rows = seriesByUid[uid] || [];
    const color = colorForRoom(uid);

    if (showBand) {
      datasets.push({
        label: `${nameForRoom(uid)} max`,
        data: rows.map((r) => ({ x: r.timestamp, y: r[maxKey] })),
        borderColor: 'transparent',
        backgroundColor: `${color}22`,
        pointRadius: 0,
        fill: '+1', // fill toward the next dataset (the matching min)
        tension: 0.3,
      });
      datasets.push({
        label: `${nameForRoom(uid)} min`,
        data: rows.map((r) => ({ x: r.timestamp, y: r[minKey] })),
        borderColor: 'transparent',
        backgroundColor: `${color}22`,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      });
    }

    datasets.push({
      label: nameForRoom(uid),
      data: rows.map((r) => ({ x: r.timestamp, y: r[metric] })),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
    });
  }

  if (outdoorRows && outdoorRows.length > 0) {
    datasets.push({
      label: 'Extérieur',
      data: outdoorRows.map((r) => ({ x: r.timestamp, y: r[metric] })),
      borderColor: '#94a3b8',
      backgroundColor: '#94a3b8',
      borderWidth: 2,
      borderDash: [5, 4],
      pointRadius: 0,
      fill: false,
      tension: 0.3,
    });
  }

  return datasets;
}
