import { getDoctorById } from './doctors';

export const activeAppointment = {
  id: '',
  doctorId: '',
  slot: '',
  period: '',
  dateLabel: '',
  type: 'Video consultation',
  status: 'No active appointment',
  note: 'Your active video appointment will appear here once it is available.',
};

export function getActiveAppointment() {
  const doctor = getDoctorById(activeAppointment.doctorId);
  return {
    ...activeAppointment,
    doctor,
  };
}
