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
