import { prisma } from "@/config";

async function findHotels() {
  return prisma.hotel.findMany();
}

async function findRoomsByHotelId(hotelId: number) {
  return prisma.room.findMany({
    where: {
      hotelId
    }
  });
}

const hotelsRepository = {
  findHotels,
  findRoomsByHotelId
};

export default hotelsRepository;
