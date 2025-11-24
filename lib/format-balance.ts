export const formatBalance = (
  seconds: number
): { minutes: string; seconds: string; isNegative: boolean } => {
  const isNegative = seconds < 0;
  const absoluteSeconds = Math.abs(seconds);

  const mins = Math.floor(absoluteSeconds / 60);
  const secs = absoluteSeconds % 60;
  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');

  return {
    minutes: paddedMins,
    seconds: paddedSecs,
    isNegative,
  };
};
