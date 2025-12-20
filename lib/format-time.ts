export const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  const s = seconds < 10 ? '0' + seconds : seconds;
  const c = centiseconds < 10 ? '0' + centiseconds : centiseconds;
  return `${s}:${c}`;
};
