import { useState, useCallback } from 'react';

export function useChartSelection(allRoomUids) {
  const [selected, setSelected] = useState(() => [...allRoomUids]);
  const [metric, setMetric] = useState('temperature');

  const isSelected = useCallback((uid) => selected.includes(uid), [selected]);
  const toggle = useCallback((uid) => {
    setSelected((cur) => (cur.includes(uid) ? cur.filter((u) => u !== uid) : [...cur, uid]));
  }, []);

  return { selected, isSelected, toggle, metric, setMetric };
}
