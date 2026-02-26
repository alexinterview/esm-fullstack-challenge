"""Pydantic response models for API endpoints."""
from typing import Optional
from pydantic import BaseModel


# =============================================================================
# RACE-RELATED RESPONSE MODELS
# =============================================================================

class CircuitResponse(BaseModel):
    """Circuit details response."""
    id: int
    circuit_ref: Optional[str] = None
    name: str
    location: Optional[str] = None
    country: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    alt: Optional[int] = None
    url: Optional[str] = None


class RaceDriverResult(BaseModel):
    """Driver result in a race."""
    result_id: int
    position: Optional[str] = None
    position_order: int
    points: float
    laps: int
    time: Optional[str] = None
    grid: int
    fastest_lap_time: Optional[str] = None
    driver_id: int
    driver_ref: Optional[str] = None
    number: Optional[str] = None
    code: Optional[str] = None
    forename: str
    surname: str
    nationality: Optional[str] = None


class RaceConstructorResult(BaseModel):
    """Constructor result in a race."""
    constructor_id: int
    constructor_ref: Optional[str] = None
    name: str
    nationality: Optional[str] = None
    total_points: float
    drivers_count: int
    best_position: int


# =============================================================================
# SEASON DASHBOARD RESPONSE MODELS
# =============================================================================

class DriverStandingResponse(BaseModel):
    """Driver championship standing."""
    id: int
    race_id: int
    driver_id: int
    points: float
    position: int
    position_text: Optional[str] = None
    wins: int
    driver_name: str
    code: Optional[str] = None
    nationality: Optional[str] = None
    year: int


class ConstructorStandingResponse(BaseModel):
    """Constructor championship standing."""
    id: int
    race_id: int
    constructor_id: int
    points: float
    position: int
    position_text: Optional[str] = None
    wins: int
    constructor_name: str
    nationality: Optional[str] = None
    year: int


class CumulativeWinResponse(BaseModel):
    """Cumulative wins data point."""
    year: int
    round: int
    date: str
    race_name: str
    driver_name: str
    surname: str
    cumulative_wins: int


class FastestLapByCircuit(BaseModel):
    """Fastest lap record by circuit."""
    circuit_id: int
    circuit_name: str
    country: Optional[str] = None
    fastest_lap_time: Optional[str] = None
    fastest_lap_speed: Optional[str] = None
    driver_name: str
    driver_code: Optional[str] = None
    constructor_name: str
    year: int
    round: int
    race_name: str


class LapTimeResponse(BaseModel):
    """Lap time data."""
    race_id: int
    driver_id: int
    lap: int
    position: int
    time: str
    milliseconds: int
    driver_name: str
    driver_code: Optional[str] = None
    constructor_name: str


class PitStopResponse(BaseModel):
    """Pit stop data."""
    race_id: int
    driver_id: int
    stop: int
    lap: int
    time: str
    duration: Optional[str] = None
    milliseconds: Optional[int] = None
    driver_name: str
    driver_code: Optional[str] = None
    constructor_name: str


class RaceResultResponse(BaseModel):
    """Full race result."""
    result_id: int
    position: Optional[str] = None
    position_order: int
    points: float
    laps: int
    time: Optional[str] = None
    grid: int
    fastest_lap_time: Optional[str] = None
    fastest_lap_speed: Optional[str] = None
    driver_id: int
    driver_name: str
    driver_code: Optional[str] = None
    driver_nationality: Optional[str] = None
    constructor_id: int
    constructor_name: str
    status: str


class ConstructorRaceResult(BaseModel):
    """Constructor result in a race."""
    constructor_id: int
    constructor_name: str
    nationality: Optional[str] = None
    total_points: float
    drivers_count: int
    best_position: int
    driver_codes: Optional[str] = None


class RaceInfoResponse(BaseModel):
    """Race info with circuit details."""
    id: int
    year: int
    round: int
    circuit_id: int
    name: str
    date: str
    time: Optional[str] = None
    url: Optional[str] = None
    fp1_date: Optional[str] = None
    fp1_time: Optional[str] = None
    fp2_date: Optional[str] = None
    fp2_time: Optional[str] = None
    fp3_date: Optional[str] = None
    fp3_time: Optional[str] = None
    quali_date: Optional[str] = None
    quali_time: Optional[str] = None
    sprint_date: Optional[str] = None
    sprint_time: Optional[str] = None
    circuit_name: str
    location: Optional[str] = None
    country: Optional[str] = None


class RaceListItem(BaseModel):
    """Race list item for selector."""
    id: int
    year: int
    round: int
    name: str
    date: str
    circuit_name: str


class DailyWeather(BaseModel):
    """Daily weather data."""
    date: str
    temp_max: Optional[float] = None
    temp_min: Optional[float] = None
    precipitation: Optional[float] = None
    wind_max: Optional[float] = None


class RaceWeatherResponse(BaseModel):
    """Race weather data."""
    race_name: str
    circuit_name: str
    country: Optional[str] = None
    race_date: str
    quali_date: Optional[str] = None
    race_weather: Optional[DailyWeather] = None
    quali_weather: Optional[DailyWeather] = None
    timezone: Optional[str] = None
    error: Optional[str] = None


class QualifyingResult(BaseModel):
    """Qualifying result."""
    id: int
    position: int
    q1: Optional[str] = None
    q2: Optional[str] = None
    q3: Optional[str] = None
    driver_id: int
    driver_name: str
    driver_code: Optional[str] = None
    nationality: Optional[str] = None
    constructor_id: int
    constructor_name: str


# =============================================================================
# NEW VISUALIZATION RESPONSE MODELS
# =============================================================================

class ChampionshipProgressionPoint(BaseModel):
    """Single data point for championship progression."""
    race_id: int
    round: int
    race_name: str
    driver_id: int
    driver_name: str
    driver_code: Optional[str] = None
    points: float
    position: int


class PositionChangePoint(BaseModel):
    """Single data point for position changes during a race."""
    lap: int
    position: int
    driver_id: int
    driver_code: Optional[str] = None
    driver_name: str
    constructor_name: str


class GridVsFinishResult(BaseModel):
    """Grid vs finish analysis for a driver."""
    driver_id: int
    driver_code: Optional[str] = None
    driver_name: str
    constructor_name: str
    grid: int
    finish_position: int
    positions_gained: int
    status: str
