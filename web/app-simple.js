/* global React, ReactDOM */

const { useEffect, useState } = React;

// Composant principal simple sans Chakra UI
function TechTempDashboard() {
  const [devices, setDevices] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Récupérer les appareils
        const devicesRes = await fetch('/api/v1/devices');
        const devicesData = await devicesRes.json();
        setDevices(devicesData.data || []);

        // Récupérer les dernières lectures
        const readingsRes = await fetch('/api/v1/readings/latest');
        const readingsData = await readingsRes.json();
        setReadings(readingsData.data || []);

        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return React.createElement('div', { className: 'loading' },
      React.createElement('h2', null, '⏳ Chargement...'),
      React.createElement('div', { className: 'spinner' })
    );
  }

  if (error) {
    return React.createElement('div', { className: 'error' },
      React.createElement('h2', null, '❌ Erreur'),
      React.createElement('p', null, error)
    );
  }

  return React.createElement('div', { className: 'dashboard' },
    React.createElement('header', { className: 'header' },
      React.createElement('h1', null, '🌡️ TechTemp Dashboard'),
      React.createElement('p', null, `Dernière mise à jour: ${new Date().toLocaleTimeString()}`)
    ),

    React.createElement('main', { className: 'main' },
      // Section appareils
      React.createElement('section', { className: 'section' },
        React.createElement('h2', null, `📱 Appareils (${devices.length})`),
        React.createElement('div', { className: 'devices-grid' },
          devices.map(device =>
            React.createElement('div', {
              key: device.uid,
              className: 'device-card'
            },
              React.createElement('h3', null, device.label || device.uid),
              React.createElement('p', null, `UID: ${device.uid}`),
              device.room_id && React.createElement('p', null, `🏠 Pièce: ${device.room_id}`)
            )
          )
        )
      ),

      // Section lectures
      React.createElement('section', { className: 'section' },
        React.createElement('h2', null, `📊 Dernières Mesures (${readings.length})`),
        React.createElement('div', { className: 'readings-grid' },
          readings.map(reading =>
            React.createElement('div', {
              key: reading.device_id,
              className: 'reading-card'
            },
              React.createElement('h3', null, reading.device_id),
              React.createElement('div', { className: 'metrics' },
                React.createElement('div', { className: 'metric' },
                  React.createElement('span', { className: 'label' }, '🌡️ Température'),
                  React.createElement('span', { className: 'value' }, `${reading.temperature}°C`)
                ),
                React.createElement('div', { className: 'metric' },
                  React.createElement('span', { className: 'label' }, '💧 Humidité'),
                  React.createElement('span', { className: 'value' }, `${reading.humidity}%`)
                )
              ),
              React.createElement('p', { className: 'timestamp' },
                `⏰ ${new Date(reading.ts).toLocaleString()}`
              )
            )
          )
        )
      )
    )
  );
}

// Montage de l'application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(TechTempDashboard));
