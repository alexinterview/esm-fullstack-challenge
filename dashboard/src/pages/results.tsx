import { useEffect, useState } from "react";
import {
  Datagrid,
  List,
  NumberField,
  ReferenceField,
  ReferenceInput,
  TextField,
} from "react-admin";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { DetailDialog, API_BASE_URL } from "../components";

interface Result {
  id: number;
  race_id: number;
  driver_id: number;
  constructor_id: number;
  number: string;
  grid: number;
  position: string;
  position_text: string;
  position_order: number;
  points: number;
  laps: number;
  time: string;
  milliseconds: string;
  fastest_lap: string;
  rank: string;
  fastest_lap_time: string;
  fastest_lap_speed: string;
  status_id: number;
}

interface RaceInfo {
  name: string;
  year: number;
  round: number;
}

interface DriverInfo {
  forename: string;
  surname: string;
  code: string;
}

interface ConstructorInfo {
  name: string;
}

interface StatusInfo {
  status: string;
}

const ResultDetailContent = ({
  result,
  race,
  driver,
  constructor: constructorInfo,
  status,
}: {
  result: Result;
  race: RaceInfo | null;
  driver: DriverInfo | null;
  constructor: ConstructorInfo | null;
  status: StatusInfo | null;
}) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {driver ? `${driver.forename} ${driver.surname}` : "Result Details"}
      </Typography>
      {race && (
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          {race.name} ({race.year}, Round {race.round})
        </Typography>
      )}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Position
          </Typography>
          <Typography>{result.position || result.position_order}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Grid
          </Typography>
          <Typography>{result.grid}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Points
          </Typography>
          <Typography>{result.points}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Constructor
          </Typography>
          <Typography>{constructorInfo?.name || "-"}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Laps
          </Typography>
          <Typography>{result.laps}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Time
          </Typography>
          <Typography>{result.time || "-"}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Fastest Lap
          </Typography>
          <Typography>{result.fastest_lap_time || "-"}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Fastest Lap Speed
          </Typography>
          <Typography>
            {result.fastest_lap_speed
              ? `${result.fastest_lap_speed} km/h`
              : "-"}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Status
          </Typography>
          <Typography>{status?.status || "-"}</Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const ResultDetailDialog = ({
  open,
  onClose,
  resultId,
}: {
  open: boolean;
  onClose: () => void;
  resultId: number | null;
}) => {
  const [result, setResult] = useState<Result | null>(null);
  const [race, setRace] = useState<RaceInfo | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [constructorInfo, setConstructorInfo] =
    useState<ConstructorInfo | null>(null);
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resultId && open) {
      setLoading(true);
      fetch(`${API_BASE_URL}/results/${resultId}`)
        .then((res) => res.json())
        .then(async (data: Result) => {
          setResult(data);
          const [raceRes, driverRes, constructorRes, statusRes] =
            await Promise.all([
              fetch(`${API_BASE_URL}/races/${data.race_id}`)
                .then((r) => r.json())
                .catch(() => null),
              fetch(`${API_BASE_URL}/drivers/${data.driver_id}`)
                .then((r) => r.json())
                .catch(() => null),
              fetch(`${API_BASE_URL}/constructors/${data.constructor_id}`)
                .then((r) => r.json())
                .catch(() => null),
              fetch(`${API_BASE_URL}/status/${data.status_id}`)
                .then((r) => r.json())
                .catch(() => null),
            ]);
          setRace(raceRes);
          setDriver(driverRes);
          setConstructorInfo(constructorRes);
          setStatus(statusRes);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [resultId, open]);

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={
        driver
          ? `${driver.forename} ${driver.surname} - Result`
          : "Result Details"
      }
      loading={loading}
      maxWidth="sm"
    >
      {result && (
        <ResultDetailContent
          result={result}
          race={race}
          driver={driver}
          constructor={constructorInfo}
          status={status}
        />
      )}
    </DetailDialog>
  );
};

const ResultFilters = [
  <ReferenceInput key="race" source="race_id" reference="races" alwaysOn>
    <></>
  </ReferenceInput>,
  <ReferenceInput key="driver" source="driver_id" reference="drivers" alwaysOn>
    <></>
  </ReferenceInput>,
];

export const ResultList = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRowClick = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  return (
    <>
      <Box sx={{ position: "relative" }}>
        <List
          perPage={50}
          filters={ResultFilters}
          sx={{
            "& .RaList-content": {
              maxHeight: "calc(100vh - 180px)",
              overflow: "auto",
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
          <Datagrid
            rowClick={(id) => {
              handleRowClick(id as number);
              return false;
            }}
          >
            <TextField source="id" />
            <ReferenceField source="race_id" reference="races" />
            <ReferenceField source="driver_id" reference="drivers" />
            <ReferenceField source="constructor_id" reference="constructors" />
            <TextField source="position" />
            <NumberField source="grid" />
            <NumberField source="points" />
            <NumberField source="laps" />
            <TextField source="time" />
            <TextField source="fastest_lap_time" label="Fastest Lap" />
            <ReferenceField source="status_id" reference="status" />
          </Datagrid>
        </List>
      </Box>
      <ResultDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        resultId={selectedId}
      />
    </>
  );
};
