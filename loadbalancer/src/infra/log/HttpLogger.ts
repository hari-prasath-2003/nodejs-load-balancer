import type { NextFunction, Request, Response } from "express";
import logger from "./Logger.js";

export default function HttpLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    logger.info(
      {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        userAgent: req.get("user-agent"),
        duration: `${duration}ms`,
      },
      "Request Processed"
    );
  });

  next();
}
