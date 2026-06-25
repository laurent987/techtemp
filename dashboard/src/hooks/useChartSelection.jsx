import { useState, useCallback, useEffect, useRef } from 'react';

export function useChartSelection(allRoomUids) {
  const [selected, setSelected] = useState([]);
  const [metric, setMetric] = useState('temperature');
  const seen = useRef(new Set());

  // Default-select every uid the first time it appears — handles the async load
  // (rooms arrive after the outdoor card) and any new sensor later. A uid the
  // user removed stays "seen", so it is never re-added on a refresh.
  useEffect(() => {
    const fresh = allRoomUids.filter((u) => !seen.current.has(u));
    if (fresh.length > 0) {
      fresh.forEach((u) => seen.current.add(u));
      setSelected((cur) => [...cur, ...fresh]);
    }
  }, [allRoomUids]);

  const isSelected = useCallback((uid) => selected.includes(uid), [selected]);
  const toggle = useCallback((uid) => {
    setSelected((cur) => (cur.includes(uid) ? cur.filter((u) => u !== uid) : [...cur, uid]));
  }, []);

  return { selected, isSelected, toggle, metric, setMetric };
}
