
import '@testing-library/jest-dom';

Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:5000/api',
    VITE_WS_URL: 'http://localhost:5000',
  },
  configurable: true,
});
