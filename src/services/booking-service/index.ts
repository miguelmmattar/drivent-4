import { notFoundError, requestError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelsRepository from "@/repositories/hotels-repository";
import ticketRepository from "@/repositories/ticket-repository";
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

async function validateBookingProcess(userId: number, roomId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  
  if(!enrollment) {
    throw notFoundError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw requestError(403, "ForbiddenError");
  }

  if(!ticket.TicketType.includesHotel) {
    throw requestError(403, "ForbiddenError");
  }

  if(ticket.status !== "PAID") {
    throw requestError(403, "ForbiddenError");
  }

  const room = await hotelsRepository.findRoomById(roomId);

  if(!room) {
    throw notFoundError();
  }

  const roomBookings = await bookingRepository.findBookingByRoomId(roomId);

  if(room.capacity === roomBookings.length) {
    throw requestError(403, "ForbiddenError");
  }
}

async function postBooking(userId: number, roomId: number) {
  await validateBookingProcess(userId, roomId);

  const newBooking = await bookingRepository.createBooking(userId, roomId);

  return newBooking.id;
}

async function updateBooking(userId: number, roomId: number, bookingId: number) {
  await validateBookingProcess(userId, roomId);

  const userBooking = await bookingRepository.findBookingByUserId(userId);

  if(!userBooking) {
    throw requestError(403, "ForbiddenError");
  }

  const newBooking = await bookingRepository.updateBooking(bookingId, roomId);

  return newBooking.id;
}

const bookingService = {
  getBookingByUserId,
  postBooking,
  updateBooking
};
  
export default bookingService;
  
