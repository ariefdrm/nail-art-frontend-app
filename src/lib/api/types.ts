import type { components } from './schema.gen'

type Schemas = components['schemas']

/** Response schemas always carry their fields, the generator marks them optional. */
export type BookingStatus = Schemas['BookingStatus']
export type Service = Required<Schemas['Service']>
export type Artist = Required<Schemas['Artist']>
/** A booking embeds its service and artist in full. */
export type Booking = Omit<Required<Schemas['Booking']>, 'service' | 'artist'> & {
  service: Service
  artist: Artist
}
export type Slot = Required<Schemas['Slot']>
export type Availability = Required<Schemas['Availability']>
export type BusinessHour = Schemas['BusinessHour']
export type BlockedSlot = Required<Schemas['BlockedSlot']>
export type AffectedBooking = Required<Schemas['AffectedBooking']>
export type BlockCheck = Required<Schemas['BlockCheck']>
export type Admin = Required<Schemas['Admin']>
export type TokenPair = Required<Schemas['TokenPair']>
export type Notification = Required<Schemas['Notification']>
export type DashboardSummary = Required<Schemas['DashboardSummary']>
export type ServiceInput = Schemas['ServiceInput']
export type ArtistInput = Schemas['ArtistInput']
export type Pagination = Required<Schemas['Pagination']>
export type ApiErrorBody = Schemas['Error']

export type Paginated<T> = { data: T[]; meta: Pagination }
