export const OVERTIME_BUFFER_MINUTES = 30
export const DEFAULT_LOGIN_TIME      = '09:00'
export const DEFAULT_LOGOUT_TIME     = '18:00'
export const DEFAULT_GRACE_MINUTES   = 0
export const STORAGE_KEY             = 'attendance_cache_v1'
export const RECORDS_KEY             = 'attendance_records_v1'

export const PRESET_SHIFTS = [
  { label: '9 AM – 6 PM',  login: '09:00', logout: '18:00' },
  { label: '10 AM – 7 PM', login: '10:00', logout: '19:00' },
  { label: '12 PM – 8 PM', login: '12:00', logout: '20:00' },
  { label: '2 PM – 10 PM', login: '14:00', logout: '22:00' },
  { label: '5 PM – 10 PM', login: '17:00', logout: '22:00' },
]
