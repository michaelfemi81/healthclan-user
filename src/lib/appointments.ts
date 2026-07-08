export function appointmentTimestamp(value: any) {
  const raw = value?.startTime || value?.scheduledAt || value?.appointmentDate || value?.date || value?.createdAt || value?.updatedAt;
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0;
}

export function appointmentDate(value: any) {
  const timestamp = appointmentTimestamp(value);
  return timestamp ? new Date(timestamp) : null;
}

export function sortAppointmentsNewestFirst<T>(items: T[] = []) {
  return items.slice().sort((first, second) => appointmentTimestamp(second) - appointmentTimestamp(first));
}
