
// Returns values with a fractional part
// 20,000.33
export function formatZoneWei(wei: bigint): string {
  const divisor = BigInt('1000000000000000000');
  const whole = wei / divisor;
  const remainder = wei % divisor;
  const remainderStr = remainder.toString().padStart(18, '0');

  let cents = parseInt(remainderStr.substring(0, 2));

  const thirdDigit = parseInt(remainderStr[2]);

  if (thirdDigit >= 6) {
    cents += 1;
    if (cents >= 100) {
      return (whole + BigInt(1)).toLocaleString('en-US');
    }
  } else if (thirdDigit === 5) {
    const restDigits = parseInt(remainderStr.substring(3));
    if (restDigits > 0) {
      cents += 1;
      if (cents >= 100) {
        return (whole + BigInt(1)).toLocaleString('en-US');
      }
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


// Returns integer values only
// 20,000
export function formatZoneWei2(wei: bigint): string {
  const divisor = BigInt('1000000000000000000');
  const whole = wei / divisor;

  return whole.toLocaleString('en-US')
}


// 1.222 -> 1.2
export function formatZoneWei3(wei: bigint): string {
  const ether = Number(wei) / 1e18;

  // Если число целое
  if (Number.isInteger(ether)) {
    return ether.toString();
  }

  // Получаем целую часть
  const integerPart = Math.floor(ether);

  // Получаем первую цифру дробной части
  const fractionalPart = Math.floor((ether - integerPart) * 10);

  // Если дробная часть равна 0, возвращаем только целое число
  if (fractionalPart === 0) {
    return integerPart.toString();
  }

  return `${integerPart}.${fractionalPart}`;
}