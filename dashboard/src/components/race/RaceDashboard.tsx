import { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { PitStop } from "../types";
import { API_BASE_URL, httpClient } from "../api";
import { RaceSelector } from "./RaceSelector";
import { RaceInfoHeader } from "./RaceInfoHeader";
import { WeatherCard } from "./WeatherCard";
import { QualifyingResultsTable } from "./QualifyingResultsTable";
import { LapTimesChart } from "./LapTimesChart";
import { PositionChangesChart } from "./PositionChangesChart";
import { GridVsFinishChart } from "./GridVsFinishChart";
import { RacePodiums } from "./RacePodiums";

const RaceDashboardContent = ({ raceId }: { raceId: number }) => {
  const [pitStops, setPitStops] = useState<PitStop[]>([]);

  useEffect(() => {
    if (raceId) {
      httpClient(`${API_BASE_URL}/dashboard/race/${raceId}/pit_stops`)
        .then((data) => setPitStops(data))
        .catch(() => setPitStops([]));
    }
  }, [raceId]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <RaceInfoHeader raceId={raceId} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <WeatherCard raceId={raceId} />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <QualifyingResultsTable raceId={raceId} />
        </Grid>
      </Grid>
      <LapTimesChart raceId={raceId} pitStops={pitStops} />
      <PositionChangesChart raceId={raceId} />
      <GridVsFinishChart raceId={raceId} />
      <RacePodiums raceId={raceId} />
    </Box>
  );
};

interface RaceDashboardProps {
  initialRaceId?: number | null;
}

export const RaceDashboard = ({ initialRaceId }: RaceDashboardProps) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(
    initialRaceId ?? null
  );

  return (
    <Box>
      <RaceSelector
        selectedYear={selectedYear}
        selectedRaceId={selectedRaceId}
        onYearChange={setSelectedYear}
        onRaceChange={setSelectedRaceId}
        initialRaceId={initialRaceId}
      />
      {selectedRaceId ? (
        <RaceDashboardContent raceId={selectedRaceId} />
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            Select a year and race to view detailed analysis
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
