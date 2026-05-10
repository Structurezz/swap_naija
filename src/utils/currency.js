/**
 * Format kobo amount as Barter Credits (BC).
 * 1 BC = ₦1 = 100 kobo
 */
export const formatBC = (kobo = 0) => {
  const bc = kobo / 100;
  return `${bc.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} BC`;
};

export const koboToBC = (kobo = 0) => kobo / 100;
export const bcToKobo = (bc = 0) => Math.round(bc * 100);
