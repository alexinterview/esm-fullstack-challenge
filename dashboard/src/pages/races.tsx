import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  DateField,
  ExportButton,
  List,
  ReferenceField,
  TopToolbar,
  UrlField,
} from "react-admin";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Link,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import { DetailDialog, TabPanel, API_BASE_URL } from "../components";

interface Race {
  id: number;
  year: number;
  round: number;
  circuit_id: number;
  name: string;
  date: string;
  time: string;
  url: string;
}

interface Circuit {
  id: number;
  circuit_ref: string;
  name: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  alt: number;
  url: string;
}

interface RaceDriver {
  result_id: number;
  position: string;
  position_order: number;
  points: number;
  laps: number;
  time: string;
  grid: number;
  fastest_lap_time: string;
  driver_id: number;
  driver_ref: string;
  number: string;
  code: string;
  forename: string;
  surname: string;
  nationality: string;
}

interface RaceConstructor {
  constructor_id: number;
  constructor_ref: string;
  name: string;
  nationality: string;
  total_points: number;
  drivers_count: number;
  best_position: number;
}

const SummaryTab = ({ race }: { race: Race }) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {race.name}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Year
          </Typography>
          <Typography>{race.year}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Round
          </Typography>
          <Typography>{race.round}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Date
          </Typography>
          <Typography>{race.date}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Time
          </Typography>
          <Typography>{race.time || "-"}</Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" color="textSecondary">
            More Info
          </Typography>
          <Link href={race.url} target="_blank" rel="noopener">
            Wikipedia
          </Link>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const CircuitTab = ({ raceId }: { raceId: number }) => {
  const [circuit, setCircuit] = useState<Circuit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/races/${raceId}/circuit`)
      .then((res) => res.json())
      .then((data) => {
        setCircuit(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [raceId]);

  if (loading) return <CircularProgress />;
  if (!circuit) return <Typography>No circuit data available</Typography>;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {circuit.name}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Location
            </Typography>
            <Typography>
              {circuit.location}, {circuit.country}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Coordinates
            </Typography>
            <Typography>
              {circuit.lat}, {circuit.lng} (Alt: {circuit.alt}m)
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Reference
            </Typography>
            <Typography>{circuit.circuit_ref}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="textSecondary">
              More Info
            </Typography>
            <Link href={circuit.url} target="_blank" rel="noopener">
              Wikipedia
            </Link>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const DriversTab = ({ raceId }: { raceId: number }) => {
  const [drivers, setDrivers] = useState<RaceDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/races/${raceId}/drivers`)
      .then((res) => res.json())
      .then((data) => {
        setDrivers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [raceId]);

  if (loading) return <CircularProgress />;
  if (!drivers.length) return <Typography>No driver data available</Typography>;

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Pos</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Nationality</TableCell>
            <TableCell>Grid</TableCell>
            <TableCell>Laps</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Points</TableCell>
            <TableCell>Fastest Lap</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.result_id}>
              <TableCell>{driver.position || driver.position_order}</TableCell>
              <TableCell>
                {driver.forename} {driver.surname}
              </TableCell>
              <TableCell>{driver.code}</TableCell>
              <TableCell>{driver.nationality}</TableCell>
              <TableCell>{driver.grid}</TableCell>
              <TableCell>{driver.laps}</TableCell>
              <TableCell>{driver.time || "-"}</TableCell>
              <TableCell>{driver.points}</TableCell>
              <TableCell>{driver.fastest_lap_time || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const ConstructorsTab = ({ raceId }: { raceId: number }) => {
  const [constructors, setConstructors] = useState<RaceConstructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/races/${raceId}/constructors`)
      .then((res) => res.json())
      .then((data) => {
        setConstructors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [raceId]);

  if (loading) return <CircularProgress />;
  if (!constructors.length)
    return <Typography>No constructor data available</Typography>;

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Team</TableCell>
            <TableCell>Nationality</TableCell>
            <TableCell>Drivers</TableCell>
            <TableCell>Best Position</TableCell>
            <TableCell>Total Points</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {constructors.map((constructor) => (
            <TableRow key={constructor.constructor_id}>
              <TableCell>{constructor.name}</TableCell>
              <TableCell>{constructor.nationality}</TableCell>
              <TableCell>{constructor.drivers_count}</TableCell>
              <TableCell>{constructor.best_position}</TableCell>
              <TableCell>{constructor.total_points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const RaceDetailDialogContent = ({ race }: { race: Race }) => {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ minHeight: 400 }}>
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Summary" />
        <Tab label="Circuit" />
        <Tab label="Drivers" />
        <Tab label="Constructors" />
      </Tabs>
      <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
        <TabPanel value={tabValue} index={0}>
          <SummaryTab race={race} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <CircuitTab raceId={race.id} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <DriversTab raceId={race.id} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <ConstructorsTab raceId={race.id} />
        </TabPanel>
      </Box>
    </Box>
  );
};

const RaceDetailDialog = ({
  open,
  onClose,
  raceId,
}: {
  open: boolean;
  onClose: () => void;
  raceId: number | null;
}) => {
  const navigate = useNavigate();
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (raceId && open) {
      setLoading(true);
      fetch(`${API_BASE_URL}/races/${raceId}`)
        .then((res) => res.json())
        .then((data) => {
          setRace(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [raceId, open]);

  const handleAnalyzeRace = () => {
    if (raceId) {
      onClose();
      navigate(`/?raceId=${raceId}`);
    }
  };

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={race?.name || "Race Details"}
      loading={loading}
      actions={
        <Button
          variant="contained"
          startIcon={<BarChartIcon />}
          onClick={handleAnalyzeRace}
        >
          Analyze Race
        </Button>
      }
    >
      {race && <RaceDetailDialogContent race={race} />}
    </DetailDialog>
  );
};

export const RaceList = () => {
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRowClick = (id: number) => {
    setSelectedRaceId(id);
    setDialogOpen(true);
    return false;
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <List
          perPage={50}
          actions={
            <TopToolbar>
              <ExportButton />
            </TopToolbar>
          }
          sx={{
            "& .RaList-content": {
              maxHeight: "calc(100vh - 180px)",
              overflowY: "scroll",
            },
            "& .MuiTable-root": {
              tableLayout: "fixed",
              width: "100%",
            },
            "& .MuiTableCell-root": {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
            "& .MuiTableCell-paddingCheckbox": {
              width: 48,
              minWidth: 48,
              maxWidth: 48,
            },
            "& .MuiTablePagination-root": {
              justifyContent: "flex-start",
            },
            "& .MuiTablePagination-toolbar": {
              justifyContent: "flex-start",
            },
            "& .MuiTablePagination-spacer": {
              display: "none",
            },
          }}
        >
          <DataTable rowClick={(id) => handleRowClick(id as number)}>
            <DataTable.Col source="id" />
            <DataTable.NumberCol source="year" />
            <DataTable.NumberCol source="round" />
            <DataTable.Col source="circuit_id">
              <ReferenceField source="circuit_id" reference="circuits" />
            </DataTable.Col>
            <DataTable.Col source="name" />
            <DataTable.Col source="date">
              <DateField source="date" />
            </DataTable.Col>
            <DataTable.Col source="time" />
            <DataTable.Col source="url">
              <UrlField source="url" />
            </DataTable.Col>
          </DataTable>
        </List>
      </Box>
      <RaceDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        raceId={selectedRaceId}
      />
    </>
  );
};
