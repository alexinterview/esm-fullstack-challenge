import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { LineChart } from "@mui/x-charts/LineChart";
import { CumulativeWin } from "../types";
import { API_BASE_URL, httpClient } from "../api";

interface CumulativeWinsChartProps {
  year: number;
}

export const CumulativeWinsChart = ({ year }: CumulativeWinsChartProps) => {
  const [data, setData] = useState<CumulativeWin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (year) {
      setLoading(true);
      httpClient(`${API_BASE_URL}/dashboard/cumulative_wins?year=${year}`)
        .then((wins) => {
          setData(wins);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [year]);

  const chartData = useMemo(() => {
    if (!data.length) return { rounds: [], series: [] };

    // Get all drivers who won during the season
    const driverTotals: Record<string, number> = {};
    data.forEach((w) => {
      driverTotals[w.driver_name] = Math.max(
        driverTotals[w.driver_name] || 0,
        w.cumulative_wins,
      );
    });

    // Get all drivers with wins, sorted by total wins
    const allDrivers = Object.entries(driverTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    // Get unique rounds in order
    const rounds = [...new Set(data.map((w) => w.round))].sort((a, b) => a - b);

    // Build series for each driver
    const series = allDrivers.map((driverName) => {
      const driverWins = data.filter((w) => w.driver_name === driverName);
      const roundMap: Record<number, number> = {};
      driverWins.forEach((w) => {
        roundMap[w.round] = Math.max(roundMap[w.round] || 0, w.cumulative_wins);
      });

      // Fill in data, carrying forward the last known value
      let lastValue = 0;
      const seriesData = rounds.map((round) => {
        if (roundMap[round] !== undefined) {
          lastValue = roundMap[round];
        }
        return lastValue;
      });

      return {
        data: seriesData,
        label: driverName,
        showMark: true,
      };
    });

    return { rounds, series };
  }, [data]);

  if (loading) return <CircularProgress size={24} />;

  if (!chartData.rounds.length) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <TrendingUpIcon color="success" />
            <Typography variant="h6">Season Wins by Round</Typography>
          </Box>
          <Typography color="text.secondary">
            No race wins data available for this season
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TrendingUpIcon color="success" />
          <Typography variant="h6">Season Wins by Round</Typography>
        </Box>
        <Box sx={{ width: "100%", height: 400 }}>
          <LineChart
            xAxis={[
              {
                data: chartData.rounds,
                label: "Round",
                scaleType: "linear",
              },
            ]}
            yAxis={[{ label: "Wins" }]}
            series={chartData.series}
            height={400}
            margin={{ left: 50, right: 20, top: 20, bottom: 80 }}
            slotProps={{
              legend: {
                direction: "row",
                position: { vertical: "bottom", horizontal: "middle" },
                padding: { top: 30 },
                itemMarkWidth: 10,
                itemMarkHeight: 10,
                markGap: 5,
                itemGap: 15,
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
