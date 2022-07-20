import type { Properties } from "./types";
import type { Diagnostic } from "typescript";

import { DiagnosticCategory, flattenDiagnosticMessageText, getLineAndCharacterOfPosition } from "typescript";
import { applyColor, applyMode, formatBody } from "./format";

export enum LogLevel {
  Error = 0,
  Warn = 1,
  Success = 2,
  Info = 3,
  Debug = 4
}

export class Logger {
  constructor(private level: LogLevel, private cwd: string){}

  error(arg: Properties | string){
    if(this.level < LogLevel.Error) return;
    if(typeof arg === "string") arg = {message: arg};

    let header = applyMode(applyColor(" \u2A2F ", "red"), "bold");
    if(arg.code) header += applyColor(arg.code+" ", "grey");
    header += applyMode(applyColor(arg.message, "red"), "bold");
    console.log(header+formatBody(arg, this.cwd));
  }

  warn(arg: Properties | string){
    if(this.level < LogLevel.Warn) return;
    if(typeof arg === "string") arg = {message: arg};

    let header = applyMode(applyColor(" \u26A0 ", "yellow"), "bold");
    if(arg.code) header += applyColor(arg.code+" ", "grey");
    header += applyMode(applyColor(arg.message, "yellow"), "bold");
    console.log(header+formatBody(arg, this.cwd));
  }

  success(arg: Properties | string){
    if(this.level < LogLevel.Success) return;
    if(typeof arg === "string") arg = {message: arg};

    let header = applyMode(applyColor(" \u2713 ", "green"), "bold");
    if(arg.code) header += applyColor(arg.code+" ", "grey");
    header += arg.message;
    console.log(header+formatBody(arg, this.cwd));
  }

  info(arg: Properties | string){
    if(this.level < LogLevel.Info) return;
    if(typeof arg === "string") arg = {message: arg};
    console.log(" \u2022 "+arg.message);
  }

  debug(arg: Properties | string){
    if(this.level < LogLevel.Debug) return;
    if(typeof arg === "string") arg = {message: arg};
    console.log(applyMode(" \u2022 "+arg.message, "dim"));
  }

  diagnostic(arg: Diagnostic | Diagnostic[]){
    if(!Array.isArray(arg)) arg = [arg];
    for(let diagnostic of arg){
      let props = propertiesFromDiagnostic(diagnostic);
      if(diagnostic.category === DiagnosticCategory.Error) this.error(props);
      else if(diagnostic.category === DiagnosticCategory.Warning) this.warn(props);
      else this.info(props);
    }
  }
}

export function propertiesFromDiagnostic(diagnostic: Diagnostic){
  let final: Properties = {
    message: flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    code: "TS"+diagnostic.code
  };
  if(diagnostic.file){
    final.file = diagnostic.file.fileName;
    final.position = getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
  }
  return final;
}