type LogObj = Record<string, unknown>;

function fmt(level: string, objOrMsg: unknown, maybeMsg?: string) {
  const ts = new Date().toISOString();
  if (typeof objOrMsg === "string") {
    console.log(`[${ts}] ${level}: ${objOrMsg}`);
  } else {
    const msg = maybeMsg ?? "";
    try {
      console.log(`[${ts}] ${level}: ${msg} ${JSON.stringify(objOrMsg)}`);
    } catch {
      console.log(`[${ts}] ${level}: ${msg}`);
    }
  }
}

export const logger = {
  info: (objOrMsg: unknown, msg?: string) => fmt("INFO", objOrMsg, msg),
  warn: (objOrMsg: unknown, msg?: string) => fmt("WARN", objOrMsg, msg),
  error: (objOrMsg: unknown, msg?: string) => fmt("ERROR", objOrMsg, msg),
  debug: (objOrMsg: unknown, msg?: string) => fmt("DEBUG", objOrMsg, msg),
};

export type Logger = typeof logger;
export type _LogObj = LogObj;
