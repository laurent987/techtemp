export function bucketForWindow(days) {
  if (days <= 7) return 'raw';
  if (days <= 31) return 'hour';
  return 'day';
}

export function buildDatasets({ roomUids, seriesByUid, metric, bucket, colorForRoom, nameForRoom }) {
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
  return datasets;
}
