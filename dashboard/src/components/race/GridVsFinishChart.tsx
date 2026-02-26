import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { BarChart } from "@mui/x-charts/BarChart";
import { GridVsFinishResult } from "../types";
import { API_BASE_URL, httpClient } from "../api";

interface GridVsFinishChartProps {
  raceId: number;
}

export const GridVsFinishChart = ({ raceId }: GridVsFinishChartProps) => {
  const [data, setData] = useState<GridVsFinishResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (raceId) {
      setLoading(true);
      httpClient(`${API_BASE_URL}/dashboard/race/${raceId}/grid_vs_finish`)
        .then((results) => {
          setData(results);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [raceId]);

  const chartData = useMemo(() => {
    if (!data.length) return { drivers: [], gained: [], lost: [], neutral: [] };

    // Sort by positions gained (most gained first)
    const sorted = [...data]
      .filter((d) => d.grid > 0) // Exclude pit lane starts
      .sort((a, b) => b.positions_gained - a.positions_gained);

    const drivers = sorted.map(
      (d) => d.driver_code || d.driver_name.split(" ").pop() || ""
    );

    // Split into separate series for coloring
    const gained = sorted.map((d) => (d.positions_gained > 0 ? d.positions_gained : null));
    const lost = sorted.map((d) => (d.positions_gained < 0 ? d.positions_gained : null));
    const neutral = sorted.map((d) => (d.positions_gained === 0 ? 0 : null));

    return { drivers, gained, lost, neutral };
  }, [data]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (!data.length)
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          No grid/finish data available for this race
        </Typography>
      </Paper>
    );

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <SwapVertIcon color="info" />
          <Typography variant="h6">Grid vs Finish Position</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
          Green = positions gained, Red = positions lost
        </Typography>
        <Box sx={{ width: "100%", height: 500 }}>
          <BarChart
            layout="horizontal"
            yAxis={[
              {
                data: chartData.drivers,
                scaleType: "band",
                categoryGapRatio: 0.02,
              },
            ]}
            xAxis={[
              {
                label: "Positions Gained/Lost",
              },
            ]}
            series={[
              {
                data: chartData.gained,
                color: "#4caf50",
                label: "Gained",
                stack: "positions",
                valueFormatter: (value) =>
                  value !== null ? `+${value}` : "",
              },
              {
                data: chartData.lost,
                color: "#f44336",
                label: "Lost",
                stack: "positions",
                valueFormatter: (value) =>
                  value !== null ? `${value}` : "",
              },
              {
                data: chartData.neutral,
                color: "#9e9e9e",
                label: "No change",
                stack: "positions",
                valueFormatter: () => "0",
              },
            ]}
            height={500}
            margin={{ left: 60, right: 40, top: 20, bottom: 40 }}
            barLabel={(item) => {
              const value = item.value;
              if (value === null || value === undefined) return "";
              return value > 0 ? `+${value}` : `${value}`;
            }}
            slotProps={{
              legend: {
                hidden: true,
              },
              barLabel: {
                style: {
                  fontWeight: "bold",
                  fontSize: 12,
                },
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
