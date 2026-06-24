import theme, { ROOM_COLORS } from './index';

test('theme uses system color mode, no auto-follow after manual toggle', () => {
  expect(theme.config.initialColorMode).toBe('system');
  expect(theme.config.useSystemColorMode).toBe(false);
});

test('exposes 6 stable room colors', () => {
  expect(ROOM_COLORS).toHaveLength(6);
  expect(ROOM_COLORS[0]).toBe('#22d3ee');
});
