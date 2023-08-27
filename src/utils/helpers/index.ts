import { isEmpty, isNil, pipe, range } from 'ramda';
import type { SyntheticEvent } from 'react';

export type OptionalString = string | null | undefined;

export const handleEventPreventingDefault = <T>(handler: () => T) => pipe(
  (e: SyntheticEvent) => e.preventDefault(),
  handler,
);

export const rangeOf = <T>(size: number, mappingFn: (value: number) => T, startAt = 1): T[] =>
  range(startAt, size + 1).map(mappingFn);

export type Empty = null | undefined | '' | never[];

export const hasValue = <T>(value: T | Empty): value is T => !isNil(value) && !isEmpty(value);

export const nonEmptyValueOrNull = <T>(value: T): T | null => (isEmpty(value) ? null : value);

export type BooleanString = 'true' | 'false';

export const parseBooleanToString = (value: boolean): BooleanString => (value ? 'true' : 'false');

export const parseOptionalBooleanToString = (value?: boolean): BooleanString | undefined => (
  value === undefined ? undefined : parseBooleanToString(value)
);
