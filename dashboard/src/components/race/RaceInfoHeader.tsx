import { useState, useEffect } from "react";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import { RaceInfo } from "../types";
import { API_BASE_URL, httpClient } from "../api";

interface RaceInfoHeaderProps {
  raceId: number;
}

export const RaceInfoHeader = ({ raceId }: RaceInfoHeaderProps) => {
  const [raceInfo, setRaceInfo] = useState<RaceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (raceId) {
      setLoading(true);
      httpClient(`${API_BASE_URL}/dashboard/race/${raceId}/info`)
        .then((data) => {
          setRaceInfo(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [raceId]);

  if (loading) return <CircularProgress size={24} />;
  if (!raceInfo) return null;

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <FlagIcon color="primary" />
        <Typography variant="h5">{raceInfo.name}</Typography>
      </Box>
      <Typography color="text.secondary">
        {raceInfo.circuit_name} - {raceInfo.location}, {raceInfo.country}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {raceInfo.date} | Round {raceInfo.round} of {raceInfo.year}
      </Typography>
    </Paper>
  );
};
