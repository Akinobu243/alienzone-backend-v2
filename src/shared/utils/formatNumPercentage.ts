// returns num in absoulte format, without + or -
export function formatNumPercentage(num: number): string {
  if (!Number.isFinite(num)) return num.toString();

  const [integerPart, fractionalPart] = Math.abs(num).toString().split('.');

  if (!fractionalPart) return integerPart;

  let shortenedFractional = fractionalPart.slice(0, 2);

  shortenedFractional = shortenedFractional.replace(/0+$/, '');

  if (shortenedFractional.length === 0) {
    return integerPart;
  }

  console.log(`Integer part ${integerPart}`)

  return `${integerPart}.${shortenedFractional}`;
}