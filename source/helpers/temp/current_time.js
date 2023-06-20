export const currTime = () => {
  const today = new Date(
    new Date().toLocaleString("en-US", "America/New_York")
  );
  const month = today.getMonth();
  const day = today.getDate();
  const year = today.getFullYear();
  const hour = today.getHours();
  const minutes = today.getMinutes();

  return `${month + 1}/${day}/${year} ${hour}:${minutes}`;
};
