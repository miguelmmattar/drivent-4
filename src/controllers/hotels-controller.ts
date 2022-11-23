import { AuthenticatedRequest } from "@/middlewares";
import hotelsService from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  try {
    const hotels = await hotelsService.getHotels();

    return res.status(httpStatus.OK).send(hotels);
  } catch (error) {
    return res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export async function getRooms(req: AuthenticatedRequest, res: Response) {
  const hotelId = Number(req.params.hotelId) as number;

  if (!hotelId) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }

  try {
    const rooms = await hotelsService.getRoomsByHotelId(hotelId);

    if (!rooms) {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }

    return res.status(httpStatus.OK).send(rooms);
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}
