import { extendTheme } from '@chakra-ui/react';

export const ROOM_COLORS = ['#22d3ee', '#818cf8', '#fb923c', '#34d399', '#f472b6', '#facc15'];

const theme = extendTheme({
  config: { initialColorMode: 'system', useSystemColorMode: false },
  fonts: {
    heading: 'system-ui, -apple-system, sans-serif',
    body: 'system-ui, -apple-system, sans-serif',
  },
  semanticTokens: {
    colors: {
      'app.bg':        { default: '#f1f5f9', _dark: '#0f172a' },
      'app.surface':   { default: '#ffffff', _dark: '#1e293b' },
      'app.border':    { default: '#e2e8f0', _dark: '#334155' },
      'app.text':      { default: '#0f172a', _dark: '#f1f5f9' },
      'app.textMuted': { default: '#64748b', _dark: '#94a3b8' },
      'app.accent':    { default: '#0891b2', _dark: '#22d3ee' },
    },
  },
  styles: {
    global: {
      body: { bg: 'app.bg', color: 'app.text' },
    },
  },
});

export default theme;
