const TEN_ROUNDING_NUMBER = 10;
const { ceil } = Math;
const formatter = new Intl.NumberFormat('en-US');

export const prettify = (number: number | string) =>
  formatter.format(Number(number));

export const roundTen = (number: number) =>
  ceil(number / TEN_ROUNDING_NUMBER) * TEN_ROUNDING_NUMBER;
