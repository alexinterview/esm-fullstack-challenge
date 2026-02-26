import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { LineChart } from "@mui/x-charts/LineChart";
import { ChampionshipProgressionPoint } from "../types";
import { API_BASE_URL, httpClient } from "../api";

interface ChampionshipProgressionChartProps {
  year: number;
}

export const ChampionshipProgressionChart = ({
  year,
}: ChampionshipProgressionChartProps) => {
  const [data, setData] = useState<ChampionshipProgressionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (year) {
      setLoading(true);
      httpClient(`${API_BASE_URL}/dashboard/championship_progression?year=${year}`)
        .then((points) => {
          setData(points);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [year]);

  const chartData = useMemo(() => {
    if (!data.length) return { rounds: [], series: [] };

    // Get final standings to determine top 10 drivers
    const lastRound = Math.max(...data.map((d) => d.round));
    const finalStandings = data
      .filter((d) => d.round === lastRound)
      .sort((a, b) => a.position - b.position)
      .slice(0, 10);

    const topDriverIds = new Set(finalStandings.map((d) => d.driver_id));

    // Get unique rounds in order
    const rounds = [...new Set(data.map((d) => d.round))].sort((a, b) => a - b);

    // Build series for each top driver
    const series = finalStandings.map((driver) => {
      const driverData = data.filter((d) => d.driver_id === driver.driver_id);
      const roundMap: Record<number, number> = {};
      driverData.forEach((d) => {
        roundMap[d.round] = d.points;
      });

      const seriesData = rounds.map((round) => roundMap[round] ?? null);

      return {
        data: seriesData,
        label: driver.driver_code || driver.driver_name.split(" ").pop() || "",
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
            <EmojiEventsIcon color="warning" />
            <Typography variant="h6">Championship Points Progression</Typography>
          </Box>
          <Typography color="text.secondary">
            No championship standings data available for this season
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <EmojiEventsIcon color="warning" />
          <Typography variant="h6">Championship Points Progression</Typography>
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
            yAxis={[{ label: "Points" }]}
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
