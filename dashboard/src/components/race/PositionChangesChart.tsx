import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import { LineChart } from "@mui/x-charts/LineChart";
import type { ChartsAxisContentProps } from "@mui/x-charts/ChartsTooltip";
import { DriverOption, PositionChangePoint, PitStop } from "../types";
import { API_BASE_URL, httpClient } from "../api";

interface PositionChangesChartProps {
  raceId: number;
}

// Custom tooltip component that includes pit stop information
const CustomAxisTooltip = ({
  pitStopsByLap,
}: {
  pitStopsByLap: Record<number, PitStop[]>;
}) => {
  return function TooltipContent(props: ChartsAxisContentProps) {
    const { axisValue, series, dataIndex } = props;
    const lap = axisValue as number;
    const pitsOnLap = pitStopsByLap[lap] || [];

    return (
      <Paper
        sx={{
          p: 1.5,
          minWidth: 180,
          maxWidth: 280,
        }}
        elevation={3}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
          Lap {lap}
        </Typography>

        {/* Driver positions */}
        {series.map((s) => {
          const value = dataIndex !== undefined ? s.data[dataIndex] : null;
          if (value === null || value === undefined) return null;
          return (
            <Box
              key={s.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: s.color,
                  }}
                />
                <Typography variant="body2">{s.label}</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                P{value}
              </Typography>
            </Box>
          );
        })}

        {/* Pit stops section */}
        {pitsOnLap.length > 0 && (
          <Box sx={{ mt: 1.5, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: "bold", color: "warning.main", display: "block", mb: 0.5 }}
            >
              🛞 Pit Stops
            </Typography>
            {pitsOnLap.map((ps, idx) => (
              <Typography key={idx} variant="caption" sx={{ display: "block" }}>
                {ps.driver_code || ps.driver_name} ({ps.duration}s)
              </Typography>
            ))}
          </Box>
        )}
      </Paper>
    );
  };
};

export const PositionChangesChart = ({ raceId }: PositionChangesChartProps) => {
  const [data, setData] = useState<PositionChangePoint[]>([]);
  const [pitStops, setPitStops] = useState<PitStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

  useEffect(() => {
    if (raceId) {
      setLoading(true);
      setSelectedDrivers([]);
      Promise.all([
        httpClient(`${API_BASE_URL}/dashboard/race/${raceId}/position_changes`),
        httpClient(`${API_BASE_URL}/dashboard/race/${raceId}/pit_stops`),
      ])
        .then(([positionResults, pitStopResults]) => {
          setData(positionResults);
          setPitStops(pitStopResults);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [raceId]);

  // Group pit stops by lap for tooltip display
  const pitStopsByLap = useMemo(() => {
    const byLap: Record<number, PitStop[]> = {};
    pitStops.forEach((ps) => {
      if (!byLap[ps.lap]) byLap[ps.lap] = [];
      byLap[ps.lap].push(ps);
    });
    return byLap;
  }, [pitStops]);

  const availableDrivers = useMemo((): DriverOption[] => {
    if (!data.length) return [];

    const driverMap: Record<
      string,
      { name: string; constructor: string; laps: number }
    > = {};

    data.forEach((point) => {
      const code = point.driver_code || point.driver_name;
      if (!driverMap[code]) {
        driverMap[code] = {
          name: point.driver_name,
          constructor: point.constructor_name,
          laps: 0,
        };
      }
      driverMap[code].laps++;
    });

    return Object.entries(driverMap)
      .map(([code, info]) => ({
        code,
        name: info.name,
        constructor: info.constructor,
        lapsCompleted: info.laps,
      }))
      .sort((a, b) => b.lapsCompleted - a.lapsCompleted);
  }, [data]);

  useEffect(() => {
    if (availableDrivers.length > 0 && selectedDrivers.length === 0) {
      setSelectedDrivers(availableDrivers.slice(0, 5).map((d) => d.code));
    }
  }, [availableDrivers]);

  const handleDriverChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedDrivers(typeof value === "string" ? value.split(",") : value);
  };

  const chartData = useMemo(() => {
    if (!data.length || !selectedDrivers.length)
      return { laps: [], series: [] };

    const driverLaps: Record<string, PositionChangePoint[]> = {};
    data.forEach((point) => {
      const key = point.driver_code || point.driver_name;
      if (!driverLaps[key]) driverLaps[key] = [];
      driverLaps[key].push(point);
    });

    const filteredDrivers = selectedDrivers
      .filter((code) => driverLaps[code])
      .map((code) => [code, driverLaps[code]] as [string, PositionChangePoint[]]);

    const maxLap = Math.max(...data.map((d) => d.lap));
    const laps = Array.from({ length: maxLap }, (_, i) => i + 1);

    const series = filteredDrivers.map(([driverCode, driverPoints]) => {
      const lapMap: Record<number, number> = {};
      driverPoints.forEach((point) => {
        lapMap[point.lap] = point.position;
      });

      const seriesData = laps.map((lap) => lapMap[lap] ?? null);

      return {
        data: seriesData,
        label: driverCode,
        showMark: false,
        connectNulls: true,
      };
    });

    return { laps, series };
  }, [data, selectedDrivers]);

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
          No position data available for this race
        </Typography>
      </Paper>
    );

  return (
    <Card elevation={2}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TimelineIcon color="primary" />
              <Typography variant="h6">Position Changes</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Lap-by-lap position evolution (P1 at top)
            </Typography>
          </Box>
          <FormControl sx={{ minWidth: 300, maxWidth: 500 }}>
            <InputLabel>Drivers</InputLabel>
            <Select
              multiple
              value={selectedDrivers}
              onChange={handleDriverChange}
              input={<OutlinedInput label="Drivers" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((code) => (
                    <Chip key={code} label={code} size="small" />
                  ))}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 400,
                  },
                },
              }}
            >
              {availableDrivers.map((driver) => (
                <MenuItem key={driver.code} value={driver.code}>
                  <Checkbox
                    checked={selectedDrivers.indexOf(driver.code) > -1}
                  />
                  <ListItemText
                    primary={driver.code}
                    secondary={`${driver.name} - ${driver.constructor} (${driver.lapsCompleted} laps)`}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {selectedDrivers.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              Select at least one driver to view position changes
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ width: "100%", height: 450 }}>
            <LineChart
              xAxis={[
                {
                  data: chartData.laps,
                  label: "Lap Number",
                  scaleType: "linear",
                },
              ]}
              yAxis={[
                {
                  label: "Position",
                  reverse: true,
                  min: 1,
                  max: 20,
                },
              ]}
              series={chartData.series}
              height={420}
              margin={{ left: 50, right: 20, top: 20, bottom: 60 }}
              slots={{
                axisContent: CustomAxisTooltip({ pitStopsByLap }),
              }}
              slotProps={{
                legend: {
                  direction: "row",
                  position: { vertical: "bottom", horizontal: "middle" },
                  padding: { top: 20 },
                  itemMarkWidth: 10,
                  itemMarkHeight: 10,
                  markGap: 5,
                  itemGap: 10,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
