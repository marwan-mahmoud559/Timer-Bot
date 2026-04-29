import { startBot } from "./bot";
import { logger } from "./lib/logger";

startBot().catch((err) => {
  logger.error({ err }, "Failed to start Discord bot");
  process.exit(1);
});
