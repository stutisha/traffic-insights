import '@testing-library/jest-dom'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Recharts' ResponsiveContainer needs this; jsdom doesn't implement it.
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
})
