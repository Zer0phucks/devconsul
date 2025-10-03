/**
 * Mock KV store for testing
 */

export const mockKV = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  zadd: jest.fn().mockResolvedValue(1),
  zrange: jest.fn().mockResolvedValue([]),
  zrem: jest.fn().mockResolvedValue(1),
};

export const setupKVMocks = () => {
  mockKV.set.mockResolvedValue('OK');
  mockKV.get.mockResolvedValue(null);
  mockKV.zadd.mockResolvedValue(1);
};

export const resetKVMocks = () => {
  Object.values(mockKV).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
};
