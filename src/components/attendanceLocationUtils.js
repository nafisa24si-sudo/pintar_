export const ATTENDANCE_OFFICE = {
  latitude: 1.6776728,
  longitude: 101.4551129,
  radiusMeters: 50,
}

const earthRadiusMeters = 6_371_000
const toRadians = (degrees) => degrees * Math.PI / 180

export function getDistanceFromAttendanceOffice(latitude, longitude) {
  const officeLatitude = toRadians(ATTENDANCE_OFFICE.latitude)
  const participantLatitude = toRadians(latitude)
  const latitudeDifference = toRadians(latitude - ATTENDANCE_OFFICE.latitude)
  const longitudeDifference = toRadians(longitude - ATTENDANCE_OFFICE.longitude)
  const haversine = (
    Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(officeLatitude) * Math.cos(participantLatitude) * Math.sin(longitudeDifference / 2) ** 2
  )
  const boundedHaversine = Math.min(1, Math.max(0, haversine))

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(boundedHaversine), Math.sqrt(1 - boundedHaversine))
}

export function isWithinAttendanceOffice(latitude, longitude) {
  return getDistanceFromAttendanceOffice(latitude, longitude) <= ATTENDANCE_OFFICE.radiusMeters
}
