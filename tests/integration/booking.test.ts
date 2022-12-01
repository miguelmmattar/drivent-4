import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { 
  createEnrollmentWithAddress, 
  createUser, 
  createTicketType, 
  updateTicketType,
  createTicket, 
  createHotel, 
  createRoom,
  updateRoomCapacity,
  createBooking
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});
    
beforeEach(async () => {
  await cleanDb();
});
  
const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user doesnt have an enrollment yet", async () => {
      const token = await generateValidToken();
          
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
          
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
          
    it("should respond with status 404 when user doesnt have a booking yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
          
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
          
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
        
    it("should respond with status 200 and with existing Booking data", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const hotel = await createHotel();
      const room = await createRoom(hotel.id);
      const booking = await createBooking(user.id, room.id);
        
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
        
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual(
        {
          id: booking.id,        
          userId: booking.userId,
          roomId: booking.roomId,
          createdAt: booking.createdAt.toISOString(),
          updatedAt: booking.updatedAt.toISOString(),
          Room: {
            id: room.id,
            name: room.name,
            capacity: room.capacity,
            hotelId: room.hotelId,
            createdAt: room.createdAt.toISOString(),
            updatedAt: room.updatedAt.toISOString(),
          }
        },
      );
    });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  describe("when token is valid", () => {
    it("should respond with status 400 when no room id is given", async () => {
      const token = await generateValidToken();
            
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({});
            
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });
        
    it("should respond with status 404 when user doesnt have an enrollment yet", async () => {
      const token = await generateValidToken();
            
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
            
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
        
    it("should respond with status 403 when user doesnt have a ticket yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
            
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
            
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when ticket type does not include hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      let ticketType = await createTicketType();

      ticketType = await updateTicketType(ticketType.id, false);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
            
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when ticket status is not PAID", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      let ticketType = await createTicketType();

      ticketType = await updateTicketType(ticketType.id, true);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
            
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
            
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when given room is already at full capacity", async () => {
      const user = await createUser();
      const auxUser = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      let ticketType = await createTicketType();

      ticketType = await updateTicketType(ticketType.id, true);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      let room = await createRoom(hotel.id);

      room = await updateRoomCapacity(room.id);  
            
      await createBooking(auxUser.id, room.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
            
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 when given room id doesnt exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      let ticketType = await createTicketType();

      ticketType = await updateTicketType(ticketType.id, true);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ "roomId": -1 });

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and with booking id", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      let ticketType = await createTicketType();

      ticketType = await updateTicketType(ticketType.id, true);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom(hotel.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ "roomId": room.id });

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        bookingId: expect.any(Number),
      });
    });
  });
});

describe("PUT /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put("/booking/1");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  describe("when token is valid", () => {
    it("should respond with status 400 when no room id is given", async () => {
      const token = await generateValidToken();
            
      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({});
            
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 when no booking id is given", async () => {
      const token = await generateValidToken();
      const param: number | undefined = undefined;
            
      const response = await server.put(`/booking/${param}`).set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
            
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 when booking id is not a number", async () => {
      const token = await generateValidToken();
            
      const response = await server.put("/booking/string").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
            
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });
        
    it("should respond with status 404 when user doesnt have an enrollment yet", async () => {
      const token = await generateValidToken();
            
      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
            
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
        
    it("should respond with status 403 when user doesnt have a ticket yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
            
      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
            
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when ticket type does not include hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      let ticketType = await createTicketType();

      ticketType = await updateTicketType(ticketType.id, false);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            
      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
            
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when ticket status is not PAID", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      let ticketType = await createTicketType();

      ticketType = await updateTicketType(ticketType.id, true);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
            
      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
            
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when given room is already at full capacity", async () => {
      const user = await createUser();
      const auxUser = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      let ticketType = await createTicketType();

      ticketType = await updateTicketType(ticketType.id, true);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom(hotel.id);
      const booking = await createBooking(user.id, room.id);
      let newRoom = await createRoom(hotel.id);
            
      newRoom = await updateRoomCapacity(newRoom.id);  
            
      await createBooking(auxUser.id, newRoom.id);
            
      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: newRoom.id });
            
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 when given room id doesnt exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      let ticketType = await createTicketType();

      ticketType = await updateTicketType(ticketType.id, true);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom(hotel.id);
      const booking = await createBooking(user.id, room.id);

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ "roomId": -1 });

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and with booking id", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      let ticketType = await createTicketType();

      ticketType = await updateTicketType(ticketType.id, true);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoom(hotel.id);
      const booking = await createBooking(user.id, room.id);
      const newRoom = await createRoom(hotel.id);

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ "roomId": newRoom.id });

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        bookingId: expect.any(Number),
      });
    });
  });
});
