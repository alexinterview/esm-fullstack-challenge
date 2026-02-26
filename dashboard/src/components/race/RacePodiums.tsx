import { useState, useEffect } from "react";
import { Box, CircularProgress, Grid } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import BuildIcon from "@mui/icons-material/Build";
import { ConstructorResult, PitStop, RaceResult } from "../types";
import { API_BASE_URL, httpClient } from "../api";
import { PodiumCard } from "./PodiumCard";

interface RacePodiumsProps {
  raceId: number;
}

export const RacePodiums = ({ raceId }: RacePodiumsProps) => {
  const [results, setResults] = useState<RaceResult[]>([]);
  const [constructorResults, setConstructorResults] = useState<
    ConstructorResult[]
  >([]);
  const [pitStops, setPitStops] = useState<PitStop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (raceId) {
      setLoading(true);
      Promise.all([
        httpClient(`${API_BASE_URL}/dashboard/race/${raceId}/results`),
        httpClient(
          `${API_BASE_URL}/dashboard/race/${raceId}/constructor_results`,
        ),
        httpClient(
          `${API_BASE_URL}/dashboard/race/${raceId}/fastest_pit_stops`,
        ),
      ])
        .then(([resultsData, constructorData, pitStopData]) => {
          setResults(resultsData);
          setConstructorResults(constructorData);
          setPitStops(pitStopData);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [raceId]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <PodiumCard
          title="Driver Podium"
          icon={<EmojiEventsIcon color="warning" />}
          data={results}
          labelKey="driver_name"
          subtitleKey="constructor_name"
          valueKey="time"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <PodiumCard
          title="Constructor Podium"
          icon={<DirectionsCarIcon color="primary" />}
          data={constructorResults}
          labelKey="constructor_name"
          subtitleKey="driver_codes"
          valueKey="total_points"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <PodiumCard
          title="Pit Crew Podium"
          icon={<BuildIcon color="secondary" />}
          data={pitStops}
          labelKey="constructor_name"
          subtitleKey="driver_code"
          valueKey="duration"
        />
      </Grid>
    </Grid>
  );
};
