import { dewPoint, humidex, comfortColor, comfortLabel } from './comfort';

test('dewPoint(28, 75) ≈ 23.2', () => {
  expect(dewPoint(28, 75)).toBeCloseTo(23.2, 1);
});

test('humidex(28, 75) ≈ 38', () => {
  expect(Math.round(humidex(28, 75))).toBe(38);
});

test('comfortColor/label scale by humidex band', () => {
  expect(comfortColor(25)).toBe('#22c55e');
  expect(comfortColor(35)).toBe('#fb923c');
  expect(comfortColor(42)).toBe('#f87171');
  expect(comfortLabel(25)).toBe('confortable');
  expect(comfortLabel(35)).toBe('lourd');
  expect(comfortLabel(42)).toBe('pénible');
});
