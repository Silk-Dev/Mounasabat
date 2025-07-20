import request from "supertest";
import http from "http";
import { apiResolver } from "next/dist/server/api-utils";

// Mock the entire 'packages/events/src' module
jest.mock("packages/events/src", () => ({
  createEvent: jest.fn(),
  getEvent: jest.fn(),
  getEvents: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
}));

// Mock '@mounasabet/database/src/auth'
jest.mock("@mounasabet/database/src/auth", () => ({
  auth: {
    getSession: jest.fn(),
  },
}));

// Import the mocked functions after mocking the module
import {
  createEvent,
  getEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} from "packages/events/src";
import { auth } from "@mounasabet/database/src/auth";

describe("Event API", () => {
  let server: http.Server;
  let url: string;

  beforeAll(async () => {
    // Dynamically import the API handler
    const handler = require("../../pages/api/events").default;
    server = http.createServer((req, res) =>
      apiResolver(req, res, undefined, handler, {}),
    );
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        url = `http://127.0.0.1:${(server.address() as any).port}`;
        resolve();
      });
    });

    // Mock authentication to always return a session for testing authenticated routes
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "test-user" },
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    // Reset mocks before each test
    (createEvent as jest.Mock).mockReset();
    (getEvent as jest.Mock).mockReset();
    (getEvents as jest.Mock).mockReset();
    (updateEvent as jest.Mock).mockReset();
    (deleteEvent as jest.Mock).mockReset();
  });

  it("should create an event", async () => {
    const mockEvent = {
      id: "1",
      name: "Test Event",
      type: "Wedding",
      status: "draft",
    };
    (createEvent as jest.Mock).mockResolvedValue(mockEvent);

    const res = await request(url).post("/").send({
      name: "Test Event",
      type: "Wedding",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(mockEvent);
    expect(createEvent).toHaveBeenCalledWith({
      name: "Test Event",
      type: "Wedding",
    });
  });

  it("should return 400 if event creation fails due to validation", async () => {
    (createEvent as jest.Mock).mockRejectedValue(
      new Error("Event name is required"),
    );

    const res = await request(url).post("/").send({
      type: "Wedding",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ message: "Event name is required" });
  });

  it("should get all events", async () => {
    const mockEvents = [
      { id: "1", name: "Event 1" },
      { id: "2", name: "Event 2" },
    ];
    (getEvents as jest.Mock).mockResolvedValue(mockEvents);

    const res = await request(url).get("/");

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockEvents);
    expect(getEvents).toHaveBeenCalledTimes(1);
  });

  it("should get a single event by ID", async () => {
    const mockEvent = { id: "1", name: "Event 1" };
    (getEvent as jest.Mock).mockResolvedValue(mockEvent);

    const res = await request(url).get("/?id=1");

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockEvent);
    expect(getEvent).toHaveBeenCalledWith("1");
  });

  it("should return 404 if event not found", async () => {
    (getEvent as jest.Mock).mockResolvedValue(null);

    const res = await request(url).get("/?id=999");

    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({ message: "Event not found" });
  });

  it("should update an event", async () => {
    const updatedEvent = {
      id: "1",
      name: "Updated Event",
      type: "Wedding",
      status: "active",
    };
    (updateEvent as jest.Mock).mockResolvedValue(updatedEvent);

    const res = await request(url).put("/").send({
      id: "1",
      name: "Updated Event",
      type: "Wedding",
      status: "active",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(updatedEvent);
    expect(updateEvent).toHaveBeenCalledWith("1", {
      name: "Updated Event",
      type: "Wedding",
      status: "active",
    });
  });

  it("should delete an event", async () => {
    (deleteEvent as jest.Mock).mockResolvedValue(undefined);

    const res = await request(url).delete("/?id=1");

    expect(res.statusCode).toEqual(204);
    expect(deleteEvent).toHaveBeenCalledWith("1");
  });

  it("should return 405 for unsupported methods", async () => {
    const res = await request(url).patch("/");
    expect(res.statusCode).toEqual(405);
    expect(res.headers.allow).toEqual("POST, GET, PUT, DELETE");
  });
});
