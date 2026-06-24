const A = 17.625;
const B = 243.04;

function esHpa(tempC) {
  return 6.112 * Math.exp((A * tempC) / (B + tempC));
}

export function dewPoint(tempC, rhPct) {
  const gamma = Math.log(rhPct / 100) + (A * tempC) / (B + tempC);
  return (B * gamma) / (A - gamma);
}

export function humidex(tempC, rhPct) {
  // vapor pressure (hPa) from temperature + relative humidity
  const e = (rhPct / 100) * esHpa(tempC);
  const h = tempC + 0.5555 * (e - 10);
  return h < tempC ? tempC : h; // dry air: no negative bonus
}

export function comfortColor(humidexValue) {
  if (humidexValue < 30) return '#22c55e'; // confortable
  if (humidexValue < 40) return '#fb923c'; // lourd
  return '#f87171'; // pénible
}

export function comfortLabel(humidexValue) {
  if (humidexValue < 30) return 'confortable';
  if (humidexValue < 40) return 'lourd';
  return 'pénible';
}
