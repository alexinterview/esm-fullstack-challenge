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

interface Qualifying {
  id: number;
  race_id: number;
  driver_id: number;
  constructor_id: number;
  number: number;
  position: number;
  q1: string;
  q2: string;
  q3: string;
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

const QualifyingDetailContent = ({
  qualifying,
  race,
  driver,
  constructor: constructorInfo,
}: {
  qualifying: Qualifying;
  race: RaceInfo | null;
  driver: DriverInfo | null;
  constructor: ConstructorInfo | null;
}) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {driver ? `${driver.forename} ${driver.surname}` : "Qualifying Details"}
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
          <Typography variant="h6">{qualifying.position}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Number
          </Typography>
          <Typography>{qualifying.number}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Constructor
          </Typography>
          <Typography>{constructorInfo?.name || "-"}</Typography>
        </Grid>
      </Grid>
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        Session Times
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Q1
              </Typography>
              <Typography variant="h6">{qualifying.q1 || "-"}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Q2
              </Typography>
              <Typography variant="h6">{qualifying.q2 || "-"}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Q3
              </Typography>
              <Typography variant="h6">{qualifying.q3 || "-"}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const QualifyingDetailDialog = ({
  open,
  onClose,
  qualifyingId,
}: {
  open: boolean;
  onClose: () => void;
  qualifyingId: number | null;
}) => {
  const [qualifying, setQualifying] = useState<Qualifying | null>(null);
  const [race, setRace] = useState<RaceInfo | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [constructorInfo, setConstructorInfo] =
    useState<ConstructorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (qualifyingId && open) {
      setLoading(true);
      fetch(`${API_BASE_URL}/qualifying/${qualifyingId}`)
        .then((res) => res.json())
        .then(async (data: Qualifying) => {
          setQualifying(data);
          const [raceRes, driverRes, constructorRes] = await Promise.all([
            fetch(`${API_BASE_URL}/races/${data.race_id}`)
              .then((r) => r.json())
              .catch(() => null),
            fetch(`${API_BASE_URL}/drivers/${data.driver_id}`)
              .then((r) => r.json())
              .catch(() => null),
            fetch(`${API_BASE_URL}/constructors/${data.constructor_id}`)
              .then((r) => r.json())
              .catch(() => null),
          ]);
          setRace(raceRes);
          setDriver(driverRes);
          setConstructorInfo(constructorRes);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [qualifyingId, open]);

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={
        driver
          ? `${driver.forename} ${driver.surname} - Qualifying`
          : "Qualifying Details"
      }
      loading={loading}
      maxWidth="sm"
    >
      {qualifying && (
        <QualifyingDetailContent
          qualifying={qualifying}
          race={race}
          driver={driver}
          constructor={constructorInfo}
        />
      )}
    </DetailDialog>
  );
};

const QualifyingFilters = [
  <ReferenceInput key="race" source="race_id" reference="races" alwaysOn>
    <></>
  </ReferenceInput>,
  <ReferenceInput key="driver" source="driver_id" reference="drivers" alwaysOn>
    <></>
  </ReferenceInput>,
];

export const QualifyingList = () => {
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
          filters={QualifyingFilters}
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
            <NumberField source="number" />
            <NumberField source="position" />
            <TextField source="q1" label="Q1" />
            <TextField source="q2" label="Q2" />
            <TextField source="q3" label="Q3" />
          </Datagrid>
        </List>
      </Box>
      <QualifyingDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        qualifyingId={selectedId}
      />
    </>
  );
};
