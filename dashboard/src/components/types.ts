export interface Race {
  id: number;
  year: number;
  round: number;
  name: string;
  date: string;
  circuit_name: string;
  location?: string;
  country?: string;
  winner_name?: string;
  winner_code?: string;
  winner_constructor?: string;
}

export interface DriverStanding {
  driver_id: number;
  driver_name: string;
  code: string;
  nationality: string;
  points: number;
  position: number;
  wins: number;
  year: number;
}

export interface ConstructorStanding {
  constructor_id: number;
  constructor_name: string;
  nationality: string;
  points: number;
  position: number;
  wins: number;
  year: number;
}

export interface CumulativeWin {
  year: number;
  round: number;
  date: string;
  driver_name: string;
  surname: string;
  cumulative_wins: number;
}

export interface FastestLap {
  circuit_id: number;
  circuit_name: string;
  country: string;
  fastest_lap_time: string;
  fastest_lap_speed: string;
  driver_name: string;
  driver_code: string;
  constructor_name: string;
  year: number;
  round: number;
}

export interface LapTime {
  race_id: number;
  driver_id: number;
  lap: number;
  position: number;
  time: string;
  milliseconds: number;
  driver_name: string;
  driver_code: string;
  constructor_name: string;
}

export interface PitStop {
  race_id: number;
  driver_id: number;
  stop: number;
  lap: number;
  duration: string;
  milliseconds: number;
  driver_name: string;
  driver_code: string;
  constructor_name: string;
}

export interface RaceResult {
  result_id: number;
  position: string;
  position_order: number;
  points: number;
  time: string;
  driver_id: number;
  driver_name: string;
  driver_code: string;
  constructor_id: number;
  constructor_name: string;
  status: string;
}

export interface ConstructorResult {
  constructor_id: number;
  constructor_name: string;
  total_points: number;
  best_position: number;
  driver_codes: string;
}

export interface RaceInfo {
  id: number;
  year: number;
  round: number;
  name: string;
  date: string;
  circuit_name: string;
  location: string;
  country: string;
}

export interface DayWeather {
  date: string;
  temp_max: number | null;
  temp_min: number | null;
  precipitation: number | null;
  wind_max: number | null;
}

export interface RaceWeather {
  race_name: string;
  circuit_name: string;
  country: string;
  race_date: string;
  quali_date: string | null;
  race_weather: DayWeather | null;
  quali_weather: DayWeather | null;
  timezone: string;
  error?: string;
}

export interface QualifyingResult {
  id: number;
  position: number;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  driver_id: number;
  driver_name: string;
  driver_code: string;
  nationality: string;
  constructor_id: number;
  constructor_name: string;
}

export interface DriverOption {
  code: string;
  name: string;
  constructor: string;
  lapsCompleted: number;
}

export interface ChampionshipProgressionPoint {
  race_id: number;
  round: number;
  race_name: string;
  driver_id: number;
  driver_name: string;
  driver_code: string | null;
  points: number;
  position: number;
}

export interface PositionChangePoint {
  lap: number;
  position: number;
  driver_id: number;
  driver_code: string | null;
  driver_name: string;
  constructor_name: string;
}

export interface GridVsFinishResult {
  driver_id: number;
  driver_code: string | null;
  driver_name: string;
  constructor_name: string;
  grid: number;
  finish_position: number;
  positions_gained: number;
  status: string;
}
