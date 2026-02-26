import { useState, useEffect, useRef } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Race } from "../types";
import { API_BASE_URL, httpClient } from "../api";

interface RaceSelectorProps {
  selectedYear: number | null;
  selectedRaceId: number | null;
  onYearChange: (year: number) => void;
  onRaceChange: (raceId: number) => void;
  initialRaceId?: number | null;
}

export const RaceSelector = ({
  selectedYear,
  selectedRaceId,
  onYearChange,
  onRaceChange,
  initialRaceId,
}: RaceSelectorProps) => {
  const [years, setYears] = useState<number[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const initializedRef = useRef(false);
  const yearChangedByInitRef = useRef(false);

  // Handle initial race ID - fetch the race to get its year
  useEffect(() => {
    if (initialRaceId && !initializedRef.current) {
      initializedRef.current = true;
      httpClient(`${API_BASE_URL}/races/${initialRaceId}`)
        .then((race: Race) => {
          yearChangedByInitRef.current = true;
          onYearChange(race.year);
        })
        .catch(() => {
          // Fall back to normal behavior if race fetch fails
          initializedRef.current = false;
        });
    }
  }, [initialRaceId]);

  useEffect(() => {
    httpClient(`${API_BASE_URL}/dashboard/years_list`)
      .then((data) => {
        setYears(data);
        setLoadingYears(false);
        // Only auto-select year if no initial race ID was provided
        if (data.length > 0 && !selectedYear && !initialRaceId) {
          onYearChange(data[0]);
        }
      })
      .catch(() => setLoadingYears(false));
  }, []);

  useEffect(() => {
    if (selectedYear) {
      setLoadingRaces(true);
      httpClient(`${API_BASE_URL}/dashboard/races_list?year=${selectedYear}`)
        .then((data) => {
          setRaces(data);
          setLoadingRaces(false);
          // Only auto-select race if this wasn't triggered by initial race ID
          if (data.length > 0 && !yearChangedByInitRef.current) {
            onRaceChange(data[0].id);
          }
          yearChangedByInitRef.current = false;
        })
        .catch(() => setLoadingRaces(false));
    }
  }, [selectedYear]);

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Year</InputLabel>
        <Select
          value={selectedYear || ""}
          label="Year"
          onChange={(e) => onYearChange(e.target.value as number)}
          disabled={loadingYears}
        >
          {years.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ minWidth: 300 }}>
        <InputLabel>Race</InputLabel>
        <Select
          value={selectedRaceId || ""}
          label="Race"
          onChange={(e) => onRaceChange(e.target.value as number)}
          disabled={loadingRaces || !races.length}
        >
          {races.map((race) => (
            <MenuItem key={race.id} value={race.id}>
              Round {race.round}: {race.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
