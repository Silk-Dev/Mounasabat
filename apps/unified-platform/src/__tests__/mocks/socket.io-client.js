/**
 * Socket.IO Client mock for real data tests
 * 
 * This mock prevents real WebSocket connections during tests
 * while still allowing us to test real-time functionality.
 */

const socketMock = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  id: 'mock-socket-id'
};

const ioMock = jest.fn(() => socketMock);

module.exports = ioMock;