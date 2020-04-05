export const formatMacAddress = (str: string): string => {
  const matches = str.match(/../g);
  if (!matches || matches.length === 0) {
    throw new Error('Invalid MAC address');
  }
  return matches.join(':');
};
