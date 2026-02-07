import { pino } from "pino";
import path from "path";

const isDev = process.env.NODE_ENV === "dev";
const logfile = path.join(process.cwd(), "logs/app.log");
const targets: any[] = [
  {
    target: "pino-roll",
    options: {
      file: logfile,
      frequency: "daily",
      mkdir: true,
    },
    level: "info",
  },
];

if (isDev) {
  targets.push({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      // ignore: "pid,hostname",
    },
    level: "debug",
  });
} else {
  targets.push({
    target: "pino/file",
    options: { destination: 1 },
    level: "info",
  });
}

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    targets: targets,
  },
});

export default logger;
