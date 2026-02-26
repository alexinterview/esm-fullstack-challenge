import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AirIcon from "@mui/icons-material/Air";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import CloudIcon from "@mui/icons-material/Cloud";
import { DayWeather, RaceWeather } from "../types";
import { API_BASE_URL, httpClient } from "../api";

interface WeatherCardProps {
  raceId: number;
}

export const WeatherCard = ({ raceId }: WeatherCardProps) => {
  const [weather, setWeather] = useState<RaceWeather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (raceId) {
      setLoading(true);
      httpClient(`${API_BASE_URL}/dashboard/race/${raceId}/weather`)
        .then((data) => {
          setWeather(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [raceId]);

  if (loading)
    return (
      <Card elevation={2} sx={{ height: "100%" }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    );

  if (!weather || weather.error)
    return (
      <Card elevation={2} sx={{ height: "100%" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <WbSunnyIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Weather
          </Typography>
          <Typography color="text.secondary">
            {weather?.error || "Weather data unavailable"}
          </Typography>
        </CardContent>
      </Card>
    );

  const WeatherDay = ({
    title,
    data,
    icon,
  }: {
    title: string;
    data: DayWeather | null;
    icon: React.ReactNode;
  }) => {
    if (!data) return null;

    const isRainy = data.precipitation && data.precipitation > 0;

    return (
      <Paper sx={{ p: 2, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          {icon}
          <Typography variant="subtitle1" fontWeight="medium">
            {title}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {data.date}
        </Typography>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid size={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ThermostatIcon fontSize="small" color="error" />
              <Typography variant="body2">
                {data.temp_max?.toFixed(1)}° / {data.temp_min?.toFixed(1)}°C
              </Typography>
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AirIcon fontSize="small" color="primary" />
              <Typography variant="body2">
                {data.wind_max?.toFixed(0)} km/h
              </Typography>
            </Box>
          </Grid>
          <Grid size={12}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <WaterDropIcon
                fontSize="small"
                color={isRainy ? "info" : "disabled"}
              />
              <Typography
                variant="body2"
                color={isRainy ? "info.main" : "text.secondary"}
              >
                {data.precipitation?.toFixed(1)} mm
                {isRainy && " (Rain)"}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <Card elevation={2} sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <WbSunnyIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Race Weekend Weather
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {weather.quali_weather && (
            <WeatherDay
              title="Qualifying"
              data={weather.quali_weather}
              icon={<CloudIcon color="action" />}
            />
          )}
          <WeatherDay
            title="Race Day"
            data={weather.race_weather}
            icon={<WbSunnyIcon color="warning" />}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
