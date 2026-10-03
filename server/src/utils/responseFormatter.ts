import { StatusCodes } from "http-status-codes";
import type { Response } from "express";

export function successResponse(
  res: Response,
  data: unknown,
  message = "Success",
  statusCode = StatusCodes.OK,
  token?: string,
): void {
  res.status(statusCode).json({ success: true, message, data, token });
}

export function errorResponse(
  res: Response,
  message = "Error occurred",
  statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
  field?: string,
): void {
  const body: { error: string; field?: string } = { error: message };
  if (field) body.field = field;
  res.status(statusCode).json(body);
}

export function paginatedResponse(
  res: Response,
  data: unknown,
  pagination: { totalCount: number; totalPages: number; currentPage: number },
  message = "Success",
): void {
  res.status(StatusCodes.OK).json({
    success: true,
    message,
    data,
    totalCount: pagination.totalCount,
    totalPages: pagination.totalPages,
    currentPage: pagination.currentPage,
  });
}

export function noContentResponse(res: Response): void {
  res.status(StatusCodes.NO_CONTENT).send();
}
