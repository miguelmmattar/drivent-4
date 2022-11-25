import { notFoundError, requestError } from "@/errors";
import hotelsRepository from "@/repositories/hotels-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function getHotels(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    
  if(!enrollment) {
    throw notFoundError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw notFoundError();
  }

  if(!ticket.TicketType.includesHotel) {
    throw requestError(400, "BadRequestError");
  }

  if(ticket.status !== "PAID") {
    throw requestError(402, "PaymentRequiredError");
  }
  
  const hotels = await hotelsRepository.findHotels();

  if (!hotels) {
    throw notFoundError();
  }
  return hotels;
}

async function getRoomsByHotelId(hotelId: number, userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if(!enrollment) {
    throw notFoundError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw notFoundError();
  }

  if(!ticket.TicketType.includesHotel) {
    throw requestError(400, "BadRequestError");
  }

  if(ticket.status !== "PAID") {
    throw requestError(402, "PaymentRequiredError");
  }

  const hotels = await hotelsRepository.findHotels();

  if(!hotels.find(hotel => hotel.id === hotelId)) {
    throw notFoundError();
  }

  const rooms = await hotelsRepository.findRoomsByHotelId(hotelId);

  if (!rooms) {
    throw notFoundError();
  }
  return rooms;
}

const hotelsService = {
  getHotels,
  getRoomsByHotelId
};

export default hotelsService;
