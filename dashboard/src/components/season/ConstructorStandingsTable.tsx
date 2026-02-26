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
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { ConstructorStanding } from "../types";
import { API_BASE_URL, httpClient } from "../api";

const medalColors: Record<number, string> = {
  1: "#FFD700", // Gold
  2: "#C0C0C0", // Silver
  3: "#CD7F32", // Bronze
};

interface ConstructorStandingsTableProps {
  year: number;
}

export const ConstructorStandingsTable = ({
  year,
}: ConstructorStandingsTableProps) => {
  const [standings, setStandings] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (year) {
      setLoading(true);
      httpClient(
        `${API_BASE_URL}/dashboard/constructor_standings?year=${year}&limit=10`,
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
          <DirectionsCarIcon color="primary" />
          <Typography variant="h6">
            Constructor Championship Standings
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pos</TableCell>
                <TableCell>Constructor</TableCell>
                <TableCell>Nationality</TableCell>
                <TableCell align="right">Points</TableCell>
                <TableCell align="right">Wins</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {standings.map((constructor) => (
                <TableRow key={constructor.constructor_id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {medalColors[constructor.position] && (
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: medalColors[constructor.position],
                          }}
                        />
                      )}
                      <Typography
                        fontWeight={
                          constructor.position <= 3 ? "bold" : "normal"
                        }
                        color={medalColors[constructor.position] || "inherit"}
                      >
                        {constructor.position}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{constructor.constructor_name}</TableCell>
                  <TableCell>{constructor.nationality}</TableCell>
                  <TableCell align="right">{constructor.points}</TableCell>
                  <TableCell align="right">{constructor.wins}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
