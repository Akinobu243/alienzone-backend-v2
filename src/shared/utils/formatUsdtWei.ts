
const BIG_INT_ZERO = BigInt(0)

export function formatUsdtWei(wei: bigint): string {

  if (wei < BIG_INT_ZERO) {
    wei = -wei
  }
  const divisor = BigInt(1000000);
  const whole = wei / divisor;
  const remainder = wei % divisor;

  const remainderStr = remainder.toString().padStart(6, '0');
  let cents = parseInt(remainderStr.substring(0, 2));
  const fractional = remainderStr.substring(2);

  if (parseInt(fractional) >= 10000) {
    cents += 1;
    if (cents >= 100) {
      return (whole + BigInt(1)).toLocaleString('en-US');
    }
  }

  const formattedWhole = whole.toLocaleString('en-US');

  if (cents === 0) {
    return formattedWhole;
  }

  if (cents % 10 === 0) {
    return `${formattedWhole}.${Math.floor(cents / 10)}`;
  }

  const formattedCents = cents < 10 ? `0${cents}` : cents.toString();
  return `${formattedWhole}.${formattedCents}`;
}