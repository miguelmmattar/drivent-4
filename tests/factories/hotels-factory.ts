import faker from "@faker-js/faker";
import { prisma } from "@/config";

export async function createHotel() {
  return prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.image.city(),
    },
  });
}

export async function createRoom(hotelId: number) {
  return prisma.room.create({
    data: {
      hotelId,
      name: faker.name.findName(),
      capacity: faker.datatype.number({ min: 1, max: 10 }),
    },
  });
}

export async function updateRoomCapacity(id: number) {
  return prisma.room.update({
    where: {
      id,
    },    
    data: {
      capacity: 1,
    },
  });
}
