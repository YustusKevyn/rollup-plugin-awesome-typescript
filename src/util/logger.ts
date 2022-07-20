import type { PluginContext, RollupError, RollupWarning } from "rollup";

export enum LogLevel {
  Error = 0,
  Warn = 1,
  Info = 2,
  Debug = 3
}

export class Logger {
  private level: LogLevel;
  private context?: PluginContext;

  constructor(level: LogLevel){
    this.level = level;
  }

  error(message: RollupError | string){
    if(this.level > LogLevel.Error) return;
    if(this.context) this.context.error(message);
    else if(typeof message === "string") throw new Error(message);
  }

  warn(message: RollupWarning | string){
    if(this.level > LogLevel.Warn) return;
    if(this.context) this.context.warn(message);
    else if(typeof message === "string") console.warn(message);
  }

  info(){
    if(this.level > LogLevel.Info) return;
  }

  debug(message: string){
    if(this.level > LogLevel.Debug) return;
    console.log(message);
  }
}