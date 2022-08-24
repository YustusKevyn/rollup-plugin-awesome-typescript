import type { Plugin } from "../plugin";
import type { GenericRecord, Record } from "../types";

import { apply } from "../../util/ansi";
import { EmptyLine, RecordCategory } from "../constants";

export class Tracker {
  private records: Record[] = [];

  public errors = 0;
  public warnings = 0;

  constructor(private plugin: Plugin) {}

  public record(record: Record) {
    this.records.push(record);
    if (record.category === RecordCategory.Error) this.errors++;
    else if (record.category === RecordCategory.Warning) this.warnings++;
  }

  public recordError(record: GenericRecord) {
    (record as Record).category = RecordCategory.Error;
    this.record(record as Record);
  }

  public recordWarning(record: GenericRecord) {
    (record as Record).category = RecordCategory.Warning;
    this.record(record as Record);
  }

  public recordHint(record: GenericRecord) {
    (record as Record).category = RecordCategory.Hint;
    this.record(record as Record);
  }

  public print(stats: boolean = false) {
    let logger = this.plugin.logger;

    // Records
    logger.log(EmptyLine);
    for (let record of this.records) logger.log(logger.formatRecord(record));
    if (stats) this.printStats();
  }

  private printStats() {
    let problems = this.errors + this.warnings,
      final;

    if (!problems) final = `Awesome TypeScript compiled with ${apply("no problems", "green", "bold")}`;
    else {
      final = "Awesome TypeScript compiled with ";
      final += apply(`${problems} ${problems === 1 ? "problem" : "problems"}`, "bold", "red");
      final += ` (${this.errors} ${this.errors === 1 ? "error" : "errors"}, `;
      final += `${this.warnings} ${this.warnings === 1 ? "warning" : "warnings"})`;
    }
    this.plugin.logger.log([final, EmptyLine]);
  }

  public reset() {
    this.records = [];
    this.errors = 0;
    this.warnings = 0;
  }
}
