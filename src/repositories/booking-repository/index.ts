import { prisma } from "@/config";
import { Booking, Room } from "@prisma/client";
import { receiveMessageOnPort } from "worker_threads";

async function findBookingByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId,
    },
    include: {
      Room: true,
    }
  });
}

async function findBookingByRoomId(roomId: number) {
  return prisma.booking.findMany({
    where: {
      roomId,
    }
  });
}

async function createBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId,
    }
  });
}

async function updateBooking(id: number, roomId: number) {
  return prisma.booking.update({
    where: {
      id,
    },
    data: {
      roomId,
    }
  });
}

const bookingRepository = {
  findBookingByUserId,
  findBookingByRoomId,
  createBooking,
  updateBooking
};
  
export default bookingRepository;
