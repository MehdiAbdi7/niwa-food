import { NextFunction, Request, Response } from "express";
import { z } from "zod/v4";

export function validateBodySchema<T extends z.ZodTypeAny>(schema: T) {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      next();
    } else {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        error: z.prettifyError(result.error),
      });
    }
  };
}

export function validateQuerySchema<T extends z.ZodTypeAny>(schema: T) {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const result = schema.safeParse(req.query);
    if (result.success) {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
      next();
    } else {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        error: z.prettifyError(result.error),
      });
    }
  };
}
