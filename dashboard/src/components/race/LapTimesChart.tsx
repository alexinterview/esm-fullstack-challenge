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
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import type { ChartsAxisContentProps } from "@mui/x-charts/ChartsTooltip";
import { DriverOption, LapTime, PitStop } from "../types";
import { API_BASE_URL, httpClient } from "../api";

interface LapTimesChartProps {
  raceId: number;
  pitStops: PitStop[];
}

// Custom tooltip component that includes pit stop information
const CustomLapTimeTooltip = ({
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
          minWidth: 200,
          maxWidth: 300,
        }}
        elevation={3}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
          Lap {lap}
        </Typography>

        {/* Driver lap times */}
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
                {(value as number).toFixed(3)}s
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
              Pit Stops
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

export const LapTimesChart = ({ raceId, pitStops }: LapTimesChartProps) => {
  const [lapTimes, setLapTimes] = useState<LapTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

  useEffect(() => {
    if (raceId) {
      setLoading(true);
      setSelectedDrivers([]);
      httpClient(`${API_BASE_URL}/dashboard/race/${raceId}/lap_times`)
        .then((data) => {
          setLapTimes(data);
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
    if (!lapTimes.length) return [];

    const driverMap: Record<
      string,
      { name: string; constructor: string; laps: number }
    > = {};

    lapTimes.forEach((lt) => {
      const code = lt.driver_code || lt.driver_name;
      if (!driverMap[code]) {
        driverMap[code] = {
          name: lt.driver_name,
          constructor: lt.constructor_name,
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
  }, [lapTimes]);

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
    if (!lapTimes.length || !selectedDrivers.length)
      return { laps: [], series: [] };

    const driverLaps: Record<string, LapTime[]> = {};
    lapTimes.forEach((lt) => {
      const key = lt.driver_code || lt.driver_name;
      if (!driverLaps[key]) driverLaps[key] = [];
      driverLaps[key].push(lt);
    });

    const filteredDrivers = selectedDrivers
      .filter((code) => driverLaps[code])
      .map((code) => [code, driverLaps[code]] as [string, LapTime[]]);

    const maxLap = Math.max(...lapTimes.map((lt) => lt.lap));
    const laps = Array.from({ length: maxLap }, (_, i) => i + 1);

    const series = filteredDrivers.map(([driverCode, driverLapTimes]) => {
      const lapMap: Record<number, number> = {};
      driverLapTimes.forEach((lt) => {
        lapMap[lt.lap] = lt.milliseconds / 1000;
      });

      const data = laps.map((lap) => lapMap[lap] ?? null);

      return {
        data,
        label: driverCode,
        showMark: false,
        connectNulls: true,
      };
    });

    return { laps, series };
  }, [lapTimes, selectedDrivers]);

  const selectedPitStops = useMemo(() => {
    if (!pitStops.length || !selectedDrivers.length) return [];

    const relevantStops = pitStops.filter((ps) =>
      selectedDrivers.includes(ps.driver_code || ps.driver_name),
    );

    const lapStops: Record<number, string[]> = {};
    relevantStops.forEach((ps) => {
      if (!lapStops[ps.lap]) lapStops[ps.lap] = [];
      lapStops[ps.lap].push(ps.driver_code || ps.driver_name);
    });

    return Object.entries(lapStops).map(([lap, drivers]) => ({
      lap: parseInt(lap),
      drivers,
      label: drivers.join(", "),
    }));
  }, [pitStops, selectedDrivers]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (!lapTimes.length)
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          No lap time data available for this race
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
              <ShowChartIcon color="secondary" />
              <Typography variant="h6">Lap-by-Lap Time Comparison</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Select drivers to compare lap times
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
              Select at least one driver to view lap times
            </Typography>
          </Paper>
        ) : (
          <>
            {selectedPitStops.length > 0 && (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 2,
                    bgcolor: "warning.main",
                    borderStyle: "dashed",
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Pit stops ({selectedPitStops.length} stops for selected
                  drivers)
                </Typography>
              </Box>
            )}
            <Box sx={{ width: "100%", height: 450 }}>
              <LineChart
                xAxis={[
                  {
                    data: chartData.laps,
                    label: "Lap Number",
                    scaleType: "linear",
                  },
                ]}
                yAxis={[{ label: "Lap Time (seconds)" }]}
                series={chartData.series}
                height={420}
                margin={{ left: 70, right: 20, top: 20, bottom: 60 }}
                slots={{
                  axisContent: CustomLapTimeTooltip({ pitStopsByLap }),
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
              >
                {selectedPitStops.map((stop) => (
                  <ChartsReferenceLine
                    key={`pit-${stop.lap}`}
                    x={stop.lap}
                    lineStyle={{
                      stroke: "#ed6c02",
                      strokeWidth: 1.5,
                      strokeDasharray: "4 2",
                    }}
                    labelStyle={{
                      fontSize: 10,
                      fill: "#ed6c02",
                    }}
                    label={stop.label}
                  />
                ))}
              </LineChart>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};
