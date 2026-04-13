export class ConsoleCapture {
  private static instance: ConsoleCapture;
  private logs: string[] = [];
  private maxLogs: number = 100;
  private lastLog: string | null = null;
  private repeatCount: number = 0;

  private originalLog = console.log;
  private originalWarn = console.warn;
  private originalError = console.error;
  private originalInfo = console.info;

  private constructor() {
    this.interceptConsole();
  }

  public static getInstance(): ConsoleCapture {
    if (!ConsoleCapture.instance) {
      ConsoleCapture.instance = new ConsoleCapture();
    }
    return ConsoleCapture.instance;
  }

  private interceptConsole() {
    console.log = this.createInterceptor('LOG', this.originalLog);
    console.warn = this.createInterceptor('WARN', this.originalWarn);
    console.error = this.createInterceptor('ERROR', this.originalError);
    console.info = this.createInterceptor('INFO', this.originalInfo);
  }

  private createInterceptor(type: string, originalMethod: (...args: any[]) => void) {
    return (...args: any[]) => {
      originalMethod.apply(console, args);

      const message = args.map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return '[Object]';
          }
        }
        return String(arg);
      }).join(' ');

      const formattedMessage = `[${type}] ${message}`;

      if (formattedMessage === this.lastLog) {
        this.repeatCount++;
        // Update the last log entry to include the repeat count
        if (this.logs.length > 0) {
            this.logs[this.logs.length - 1] = `${formattedMessage} (Repeated ${this.repeatCount + 1} times)`;
        }
      } else {
        this.lastLog = formattedMessage;
        this.repeatCount = 0;
        this.logs.push(formattedMessage);

        if (this.logs.length > this.maxLogs) {
          // Keep the latest logs
          this.logs.shift();
        }
      }
    };
  }

  public getLogs(): string[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.lastLog = null;
    this.repeatCount = 0;
  }
}
