import { useState, useCallback, useEffect, useRef } from 'react';

export function useChartSelection(allRoomUids) {
  const [selected, setSelected] = useState([]);
  const [metric, setMetric] = useState('temperature');
  const initialized = useRef(false);

  // Select all rooms by default — but only once they have actually loaded.
  // The devices list is empty on the first render (async fetch), so we can't
  // initialise from it directly; we do it the first time it becomes non-empty.
  // After that, the user's manual toggles are respected (no auto re-add).
  useEffect(() => {
    if (!initialized.current && allRoomUids.length > 0) {
      setSelected([...allRoomUids]);
      initialized.current = true;
    }
  }, [allRoomUids]);

  const isSelected = useCallback((uid) => selected.includes(uid), [selected]);
  const toggle = useCallback((uid) => {
    setSelected((cur) => (cur.includes(uid) ? cur.filter((u) => u !== uid) : [...cur, uid]));
  }, []);

  return { selected, isSelected, toggle, metric, setMetric };
}
