import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import { FastestLap } from "../types";
import { API_BASE_URL, httpClient } from "../api";

interface FastestLapsTableProps {
  year: number;
}

export const FastestLapsTable = ({ year }: FastestLapsTableProps) => {
  const [laps, setLaps] = useState<FastestLap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (year) {
      setLoading(true);
      httpClient(
        `${API_BASE_URL}/dashboard/fastest_laps_by_circuit?year=${year}&limit=30`,
      )
        .then((data) => {
          setLaps(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [year]);

  if (loading) return <CircularProgress size={24} />;

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <SpeedIcon color="error" />
          <Typography variant="h6">Fastest Laps by Circuit</Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Round</TableCell>
                <TableCell>Circuit</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Constructor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {laps.map((lap, idx) => (
                <TableRow key={idx}>
                  <TableCell>{lap.round}</TableCell>
                  <TableCell>{lap.circuit_name}</TableCell>
                  <TableCell>{lap.country}</TableCell>
                  <TableCell>{lap.fastest_lap_time}</TableCell>
                  <TableCell>{lap.driver_code || lap.driver_name}</TableCell>
                  <TableCell>{lap.constructor_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
