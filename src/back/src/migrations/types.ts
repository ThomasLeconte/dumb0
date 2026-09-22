import { DatabaseSync } from "node:sqlite";

export interface Migration {
  version: number;
  description: string;
  up: (db: DatabaseSync) => void;
}
