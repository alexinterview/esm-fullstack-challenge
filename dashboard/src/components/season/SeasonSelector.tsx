import { useState, useEffect } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { API_BASE_URL, httpClient } from "../api";

interface SeasonSelectorProps {
  selectedYear: number | null;
  onYearChange: (year: number) => void;
}

export const SeasonSelector = ({
  selectedYear,
  onYearChange,
}: SeasonSelectorProps) => {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    httpClient(`${API_BASE_URL}/dashboard/years_list`)
      .then((data) => {
        setYears(data);
        setLoading(false);
        if (data.length > 0 && !selectedYear) {
          onYearChange(data[0]);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel>Season</InputLabel>
        <Select
          value={selectedYear || ""}
          label="Season"
          onChange={(e) => onYearChange(e.target.value as number)}
          disabled={loading}
        >
          {years.map((year) => (
            <MenuItem key={year} value={year}>
              {year} Season
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
