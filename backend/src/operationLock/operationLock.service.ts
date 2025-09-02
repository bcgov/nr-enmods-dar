import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from "@nestjs/common";

type Operation = "PULLDOWN" | "ANALYSIS_METHODS" | "FILE_PROCESSING" | "DELETE";

@Injectable()
export class OperationLockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OperationLockService.name);

  private currentLock: Operation | null = null;

  async onModuleInit() {
    this.logger.log("Lock service initialized");
  }

  async onModuleDestroy() {
    this.logger.log("Lock service destroyed");
  }

  // Get the lock for the current operation
  acquireLock(operation: Operation) {
    if (this.currentLock) {
      this.logger.log(
        `Cannot start ${operation}. ${this.currentLock} is already running.`,
      );
      return false;
    }
    this.currentLock = operation;
    this.logger.log(`Acquired lock for operation ${operation}`);
    return true;
  }

  // Release the lock
  releaseLock(operation: Operation) {
    if (this.currentLock === operation) {
      this.currentLock = null;
      this.logger.log(`${operation} lock released`);
    }else{
        this.logger.warn(`Tried to release lock for operation ${operation}, but current lock is ${this.currentLock}`)
    }
  }

  // Check to see if any lock is active
  isLocked(): boolean {
    return this.currentLock !== null;
  }

  // Get the current lock operation
  getCurrentLock(): Operation | null {
    return this.currentLock;
  }
}
