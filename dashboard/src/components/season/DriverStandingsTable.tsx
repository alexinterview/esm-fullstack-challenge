import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { DriverStanding } from "../types";
import { API_BASE_URL, httpClient } from "../api";

const medalColors: Record<number, string> = {
  1: "#FFD700", // Gold
  2: "#C0C0C0", // Silver
  3: "#CD7F32", // Bronze
};

interface DriverStandingsTableProps {
  year: number;
}

export const DriverStandingsTable = ({ year }: DriverStandingsTableProps) => {
  const [standings, setStandings] = useState<DriverStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (year) {
      setLoading(true);
      httpClient(
        `${API_BASE_URL}/dashboard/driver_standings?year=${year}&limit=10`,
      )
        .then((data) => {
          setStandings(data);
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
          <EmojiEventsIcon color="warning" />
          <Typography variant="h6">Driver Championship Standings</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pos</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Nationality</TableCell>
                <TableCell align="right">Points</TableCell>
                <TableCell align="right">Wins</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {standings.map((driver) => (
                <TableRow key={driver.driver_id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {medalColors[driver.position] && (
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: medalColors[driver.position],
                          }}
                        />
                      )}
                      <Typography
                        fontWeight={driver.position <= 3 ? "bold" : "normal"}
                        color={medalColors[driver.position] || "inherit"}
                      >
                        {driver.position}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {driver.driver_name}
                    {driver.code && (
                      <Chip
                        label={driver.code}
                        size="small"
                        sx={{ ml: 1 }}
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>{driver.nationality}</TableCell>
                  <TableCell align="right">{driver.points}</TableCell>
                  <TableCell align="right">{driver.wins}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
