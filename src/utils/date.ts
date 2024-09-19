export function isValidDate(stringDate: string) {
  return !isNaN(Date.parse(stringDate));
}

export function getRelativeTime(stringDate: string, locale: string) {
  if (!isValidDate(stringDate)) {
    return stringDate;
  }
  const date = new Date(stringDate);
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: 'always',
    style: 'short',
  });
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInMinutes = Math.round(diffInMs / (1000 * 60));
  if (Number.isNaN(diffInMinutes)) {
    console.log(date);
    return 'error';
  }

  return formatter.format(diffInMinutes, 'minute');
}
