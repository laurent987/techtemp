import { renderHook, act } from '@testing-library/react';
import { useChartSelection } from './useChartSelection';

test('defaults: all rooms selected, metric temperature', () => {
  const { result } = renderHook(() => useChartSelection(['a', 'b']));
  expect(result.current.selected).toEqual(['a', 'b']);
  expect(result.current.metric).toBe('temperature');
});

test('toggle removes then re-adds a room', () => {
  const { result } = renderHook(() => useChartSelection(['a', 'b']));
  act(() => result.current.toggle('a'));
  expect(result.current.isSelected('a')).toBe(false);
  act(() => result.current.toggle('a'));
  expect(result.current.isSelected('a')).toBe(true);
});

test('setMetric switches to humidity', () => {
  const { result } = renderHook(() => useChartSelection(['a']));
  act(() => result.current.setMetric('humidity'));
  expect(result.current.metric).toBe('humidity');
});

test('selects all rooms once they load asynchronously (empty at first render)', () => {
  const { result, rerender } = renderHook(({ uids }) => useChartSelection(uids), {
    initialProps: { uids: [] },
  });
  expect(result.current.selected).toEqual([]); // no rooms yet
  rerender({ uids: ['a', 'b'] }); // devices finished loading
  expect(result.current.selected).toEqual(['a', 'b']);
});

test('selects newly-appearing uids by default (outdoor first, rooms load later)', () => {
  const { result, rerender } = renderHook(({ uids }) => useChartSelection(uids), {
    initialProps: { uids: ['out'] }, // outdoor present from the very first render
  });
  expect(result.current.selected).toEqual(['out']);
  rerender({ uids: ['out', 'a', 'b'] }); // rooms finished loading
  expect(result.current.selected).toEqual(['out', 'a', 'b']);
});

test('does not re-add a room the user removed when the devices list refreshes', () => {
  const { result, rerender } = renderHook(({ uids }) => useChartSelection(uids), {
    initialProps: { uids: ['a', 'b'] },
  });
  act(() => result.current.toggle('a')); // user removes 'a'
  expect(result.current.isSelected('a')).toBe(false);
  rerender({ uids: ['a', 'b'] }); // periodic refresh, same rooms
  expect(result.current.isSelected('a')).toBe(false); // stays removed
});
