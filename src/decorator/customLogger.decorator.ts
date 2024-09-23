import { Logger } from "@nestjs/common";

export function CustomLogger(target: any) {
  for (const propertyName of Object.getOwnPropertyNames(target.prototype)) {
    const originalMethod = target.prototype[propertyName];

    const logger = new Logger();
    if (propertyName === "constructor") {
      continue;
    }

    if (typeof originalMethod === "function") {
      target.prototype[propertyName] = function (...args: any[]) {
        logger.log(`Inside service ${target.name}`);
        logger.log(`Inside method of service ${propertyName}`);
        logger.log(`called with arguments: ${JSON.stringify(args)}`);
        return originalMethod.apply(this, args);
      };
    }
  }
}
