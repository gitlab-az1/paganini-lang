export type ReadonlyDict<T> = {
  readonly [key: string]: T;
}

export type Dict<T> = {
  [key: string]: T;
}

export type SourceLocationPointer = {
  line: number;
  column: number;
  position?: number;
  filename?: string;
}
