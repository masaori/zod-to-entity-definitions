/**
 * Ensures exhaustive checking of discriminated unions in switch/if statements.
 * If this function is reached, TypeScript will emit a compile error.
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
