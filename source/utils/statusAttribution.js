const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Chicago", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function statusAttribution(registrant) {
  if (!registrant.status_changed_by || !registrant.status_changed_at) return "";
  const date = new Date(registrant.status_changed_at);
  return Number.isNaN(date.getTime()) ? "" : `by ${registrant.status_changed_by} @${timeFormat.format(date)}`;
}