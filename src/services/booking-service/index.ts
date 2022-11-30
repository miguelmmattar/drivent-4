import { notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import { Booking } from "@prisma/client";

async function getBookingByUserId(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    
  if (!enrollment) {
    throw notFoundError();
  }
    
  const booking = await bookingRepository.findBookingByUserId(userId);
  
  if (!booking) {
    throw notFoundError();
  }
  return booking;
}

const bookingService = {
  getBookingByUserId,
};
  
export default bookingService;
  
