/**
 * Cache roots that more than one feature must invalidate. A change to the schedule, for example,
 * flips `schedule_conflict` on reservations, so it has to refresh the reservation views too.
 */
export const RESERVATIONS_KEY = ['reservations'] as const
