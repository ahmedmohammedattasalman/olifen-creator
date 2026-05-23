const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
export const toArabic = (n: number | string): string =>
  String(n).replace(/\d/g, (d) => map[Number(d)]);
