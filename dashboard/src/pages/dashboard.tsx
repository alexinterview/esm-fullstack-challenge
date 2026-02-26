import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Card, Tabs, Tab } from "@mui/material";
import { Title } from "react-admin";
import { SeasonDashboard, RaceDashboard } from "../components";

export const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const raceIdParam = searchParams.get("raceId");
  const initialRaceId = raceIdParam ? parseInt(raceIdParam, 10) : null;

  // Start on Race Analysis tab if a race ID is provided
  const [tabValue, setTabValue] = useState(initialRaceId ? 1 : 0);

  // Clear the URL param after reading it
  useEffect(() => {
    if (raceIdParam) {
      searchParams.delete("raceId");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  return (
    <Card elevation={2} sx={{ m: 2, p: 2 }}>
      <Title title="F1 Dashboard" />
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        >
          <Tab label="Season Analysis" />
          <Tab label="Race Analysis" />
        </Tabs>
      </Box>
      {tabValue === 0 && <SeasonDashboard />}
      {tabValue === 1 && <RaceDashboard initialRaceId={initialRaceId} />}
    </Card>
  );
};
