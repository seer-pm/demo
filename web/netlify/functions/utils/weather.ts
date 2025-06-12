export const WEATHER_CITIES = {
  LON: {
    name: "London",
    formatted: "london",
    timezone: "Europe/London",
  },
  // LIS: {
  //   name: "Lisbon",
  //   formatted: "lisbon",
  //   timezone: "Europe/Lisbon"
  // },
  // BUE: {
  //   name: "Buenos Aires",
  //   formatted: "buenos-aires",
  //   timezone: "America/Argentina/Buenos_Aires"
  // },
  // BLR: {
  //   name: "Bangalore",
  //   formatted: "bangalore",
  //   timezone: "Asia/Kolkata"
  // }
} as const;

export type CityCode = keyof typeof WEATHER_CITIES;
