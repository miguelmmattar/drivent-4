import { prisma } from "@/config";
import { Booking, Room } from "@prisma/client";

async function findBookingByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId: userId,
    },
    include: {
      Room: true,
    }
  });
}

const bookingRepository = {
  findBookingByUserId
};
  
export default bookingRepository;
