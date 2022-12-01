import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  
  try {
    const booking = await bookingService.getBookingByUserId(userId);
  
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId: number = req.body.roomId; 

  if(!roomId) {
    res.sendStatus(httpStatus.BAD_REQUEST);
  }
  
  try {
    const bookingId = await bookingService.postBooking(userId, roomId);
  
    return res.status(httpStatus.OK).send({ bookingId });
  } catch (error) {
    if(error.name === "NotFoundError") return res.sendStatus(httpStatus.NOT_FOUND);
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId: number = req.body.roomId; 
  const bookingId = Number(req.params.bookingId);

  if(!roomId) {
    res.sendStatus(httpStatus.BAD_REQUEST);
  }

  if(!bookingId) {
    res.sendStatus(httpStatus.BAD_REQUEST);
  }
  
  try {
    const newBookingId = await bookingService.updateBooking(userId, roomId, bookingId);
  
    return res.status(httpStatus.OK).send({ bookingId: newBookingId });
  } catch (error) {
    if(error.name === "NotFoundError") return res.sendStatus(httpStatus.NOT_FOUND);
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}
