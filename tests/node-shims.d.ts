declare module 'node:test' {
  export function describe(name: string, fn: () => unknown | Promise<unknown>): void;
  export function it(name: string, fn: () => unknown | Promise<unknown>): void;
}

declare module 'node:assert/strict' {
  export interface Assert {
    (value: unknown, message?: string): void;
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    notStrictEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
  }
  const assert: Assert;
  export = assert;
}
