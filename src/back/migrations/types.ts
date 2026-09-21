import {Database} from "better-sqlite3";

export interface Migration {
  version: number;
  description: string;
  up: (db: Database) => void;
}
