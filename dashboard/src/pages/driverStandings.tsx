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

interface DriverStanding {
  id: number;
  race_id: number;
  driver_id: number;
  points: number;
  position: number;
  position_text: string;
  wins: number;
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
  nationality: string;
}

const DriverStandingDetailContent = ({
  standing,
  race,
  driver,
}: {
  standing: DriverStanding;
  race: RaceInfo | null;
  driver: DriverInfo | null;
}) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {driver ? `${driver.forename} ${driver.surname}` : "Driver Standing"}
      </Typography>
      {race && (
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          After {race.name} ({race.year}, Round {race.round})
        </Typography>
      )}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="textSecondary">
                Position
              </Typography>
              <Typography variant="h4">{standing.position}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="textSecondary">
                Points
              </Typography>
              <Typography variant="h4">{standing.points}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="textSecondary">
                Wins
              </Typography>
              <Typography variant="h4">{standing.wins}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="textSecondary">
                Code
              </Typography>
              <Typography variant="h4">{driver?.code || "-"}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {driver && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Nationality
            </Typography>
            <Typography>{driver.nationality}</Typography>
          </Grid>
        )}
      </Grid>
    </CardContent>
  </Card>
);

const DriverStandingDetailDialog = ({
  open,
  onClose,
  standingId,
}: {
  open: boolean;
  onClose: () => void;
  standingId: number | null;
}) => {
  const [standing, setStanding] = useState<DriverStanding | null>(null);
  const [race, setRace] = useState<RaceInfo | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (standingId && open) {
      setLoading(true);
      fetch(`${API_BASE_URL}/driver_standings/${standingId}`)
        .then((res) => res.json())
        .then(async (data: DriverStanding) => {
          setStanding(data);
          const [raceRes, driverRes] = await Promise.all([
            fetch(`${API_BASE_URL}/races/${data.race_id}`)
              .then((r) => r.json())
              .catch(() => null),
            fetch(`${API_BASE_URL}/drivers/${data.driver_id}`)
              .then((r) => r.json())
              .catch(() => null),
          ]);
          setRace(raceRes);
          setDriver(driverRes);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [standingId, open]);

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={
        driver
          ? `${driver.forename} ${driver.surname} - Standing`
          : "Driver Standing"
      }
      loading={loading}
      maxWidth="sm"
    >
      {standing && (
        <DriverStandingDetailContent
          standing={standing}
          race={race}
          driver={driver}
        />
      )}
    </DetailDialog>
  );
};

const DriverStandingFilters = [
  <ReferenceInput key="race" source="race_id" reference="races" alwaysOn>
    <></>
  </ReferenceInput>,
];

export const DriverStandingList = () => {
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
          filters={DriverStandingFilters}
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
            <NumberField source="position" />
            <TextField source="position_text" label="Position Text" />
            <NumberField source="points" />
            <NumberField source="wins" />
          </Datagrid>
        </List>
      </Box>
      <DriverStandingDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        standingId={selectedId}
      />
    </>
  );
};
