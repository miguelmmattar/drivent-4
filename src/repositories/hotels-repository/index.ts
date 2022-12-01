import { prisma } from "@/config";

async function findHotels() {
  return prisma.hotel.findMany();
}

async function findRoomsByHotelId(hotelId: number) {
  return prisma.room.findMany({
    where: {
      hotelId
    },
    include: {
      Hotel: true
    }
  });
}

async function findRoomById(id: number) {
  return prisma.room.findFirst({
    where: {
      id,
    }
  });
}

const hotelsRepository = {
  findHotels,
  findRoomsByHotelId,
  findRoomById
};

export default hotelsRepository;
