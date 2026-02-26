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
import TimerIcon from "@mui/icons-material/Timer";
import { QualifyingResult } from "../types";
import { API_BASE_URL, httpClient } from "../api";

const medalColors: Record<number, string> = {
  1: "#FFD700", // Gold
  2: "#C0C0C0", // Silver
  3: "#CD7F32", // Bronze
};

interface QualifyingResultsTableProps {
  raceId: number;
}

export const QualifyingResultsTable = ({
  raceId,
}: QualifyingResultsTableProps) => {
  const [qualifying, setQualifying] = useState<QualifyingResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (raceId) {
      setLoading(true);
      httpClient(`${API_BASE_URL}/dashboard/race/${raceId}/qualifying`)
        .then((data) => {
          setQualifying(data);
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

  if (!qualifying.length)
    return (
      <Card elevation={2} sx={{ height: "100%" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <TimerIcon color="info" />
            <Typography variant="h6">Qualifying Results</Typography>
          </Box>
          <Typography color="text.secondary">
            No qualifying data available for this race
          </Typography>
        </CardContent>
      </Card>
    );

  return (
    <Card elevation={2} sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TimerIcon color="info" />
          <Typography variant="h6">Qualifying Results</Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Pos</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Constructor</TableCell>
                <TableCell>Q1</TableCell>
                <TableCell>Q2</TableCell>
                <TableCell>Q3</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qualifying.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {medalColors[result.position] && (
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: medalColors[result.position],
                          }}
                        />
                      )}
                      <Typography
                        fontWeight={result.position <= 3 ? "bold" : "normal"}
                        color={medalColors[result.position] || "inherit"}
                      >
                        {result.position}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {result.driver_code || result.driver_name}
                  </TableCell>
                  <TableCell>{result.constructor_name}</TableCell>
                  <TableCell>{result.q1 || "-"}</TableCell>
                  <TableCell>{result.q2 || "-"}</TableCell>
                  <TableCell sx={{ fontWeight: result.q3 ? "bold" : "normal" }}>
                    {result.q3 || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
