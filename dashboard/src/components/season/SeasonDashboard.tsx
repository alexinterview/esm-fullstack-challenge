import { useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { SeasonSelector } from "./SeasonSelector";
import { DriverStandingsTable } from "./DriverStandingsTable";
import { ConstructorStandingsTable } from "./ConstructorStandingsTable";
import { CumulativeWinsChart } from "./CumulativeWinsChart";
import { ChampionshipProgressionChart } from "./ChampionshipProgressionChart";
import { FastestLapsTable } from "./FastestLapsTable";

export const SeasonDashboard = () => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SeasonSelector
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
      {selectedYear ? (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DriverStandingsTable year={selectedYear} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ConstructorStandingsTable year={selectedYear} />
            </Grid>
          </Grid>
          <ChampionshipProgressionChart year={selectedYear} />
          <CumulativeWinsChart year={selectedYear} />
          <FastestLapsTable year={selectedYear} />
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            Select a season to view standings and statistics
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
