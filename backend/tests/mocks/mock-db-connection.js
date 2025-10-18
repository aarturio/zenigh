import { vi } from "vitest";

export function createDbMock() {
  const mockQueryBuilder = {
    where: vi.fn().mockReturnThis(),
    first: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  };

  const mockDb = vi.fn(() => mockQueryBuilder);
  mockDb.raw = vi.fn();

  return { mockDb, mockQueryBuilder };
}
