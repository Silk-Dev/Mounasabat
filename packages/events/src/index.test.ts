import { createEvent } from "./index";
import { PrismaClient } from "@prisma/client";

// Mock PrismaClient globally
jest.mock("@prisma/client", () => {
  const mPrismaClient = {
    event: {
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
  };
});

const prisma = new PrismaClient();

describe("createEvent", () => {
  beforeEach(() => {
    // Reset mocks before each test
    (prisma.event.create as jest.Mock).mockReset();
  });

  it("should create an event successfully with valid data", async () => {
    const mockEvent = {
      id: "1",
      name: "Test Event",
      description: "A test description",
      type: "Wedding",
      status: "draft",
      startDate: new Date(),
      endDate: new Date(),
    };
    (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

    const result = await createEvent({
      name: "Test Event",
      description: "A test description",
      type: "Wedding",
      status: "draft",
      startDate: new Date(),
      endDate: new Date(),
    });

    expect(prisma.event.create).toHaveBeenCalledTimes(1);
    expect(prisma.event.create).toHaveBeenCalledWith({
      data: {
        name: "Test Event",
        description: "A test description",
        type: "Wedding",
        status: "draft",
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      },
    });
    expect(result).toEqual(mockEvent);
  });

  it("should throw an error if name is missing", async () => {
    await expect(createEvent({ type: "Wedding" })).rejects.toThrow(
      "Event name is required and must be a string.",
    );
  });

  it("should throw an error if type is missing", async () => {
    await expect(createEvent({ name: "Test Event" })).rejects.toThrow(
      "Event type is required and must be a string.",
    );
  });

  it("should throw an error if name is not a string", async () => {
    await expect(createEvent({ name: 123, type: "Wedding" })).rejects.toThrow(
      "Event name is required and must be a string.",
    );
  });

  it("should throw an error if type is not a string", async () => {
    await expect(
      createEvent({ name: "Test Event", type: 123 }),
    ).rejects.toThrow("Event type is required and must be a string.");
  });
});
