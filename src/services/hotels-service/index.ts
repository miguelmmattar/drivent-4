import { notFoundError } from "@/errors";
import hotelsRepository from "@/repositories/hotels-repository";

async function getHotels() {
  const hotels = await hotelsRepository.findHotels();

  if (!hotels) {
    throw notFoundError();
  }
  return hotels;
}

async function getRoomsByHotelId(hotelId: number) {
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
