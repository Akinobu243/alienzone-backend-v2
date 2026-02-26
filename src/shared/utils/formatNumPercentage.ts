export function formatNumPercentage(num: number): string {
  if (!Number.isFinite(num)) return num.toString();

  const [integerPart, fractionalPart] = num.toString().split('.');

  if (!fractionalPart) return integerPart;

  let shortenedFractional = fractionalPart.slice(0, 2);

  shortenedFractional = shortenedFractional.replace(/0+$/, '');

  if (shortenedFractional.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${shortenedFractional}`;
}