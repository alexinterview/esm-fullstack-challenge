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

interface ConstructorStanding {
  id: number;
  race_id: number;
  constructor_id: number;
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

interface ConstructorInfo {
  name: string;
  nationality: string;
}

const ConstructorStandingDetailContent = ({
  standing,
  race,
  constructor: constructorInfo,
}: {
  standing: ConstructorStanding;
  race: RaceInfo | null;
  constructor: ConstructorInfo | null;
}) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {constructorInfo?.name || "Constructor Standing"}
      </Typography>
      {race && (
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          After {race.name} ({race.year}, Round {race.round})
        </Typography>
      )}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="textSecondary">
                Position
              </Typography>
              <Typography variant="h4">{standing.position}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="textSecondary">
                Points
              </Typography>
              <Typography variant="h4">{standing.points}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="textSecondary">
                Wins
              </Typography>
              <Typography variant="h4">{standing.wins}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {constructorInfo && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Nationality
            </Typography>
            <Typography>{constructorInfo.nationality}</Typography>
          </Grid>
        )}
      </Grid>
    </CardContent>
  </Card>
);

const ConstructorStandingDetailDialog = ({
  open,
  onClose,
  standingId,
}: {
  open: boolean;
  onClose: () => void;
  standingId: number | null;
}) => {
  const [standing, setStanding] = useState<ConstructorStanding | null>(null);
  const [race, setRace] = useState<RaceInfo | null>(null);
  const [constructorInfo, setConstructorInfo] =
    useState<ConstructorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (standingId && open) {
      setLoading(true);
      fetch(`${API_BASE_URL}/constructor_standings/${standingId}`)
        .then((res) => res.json())
        .then(async (data: ConstructorStanding) => {
          setStanding(data);
          const [raceRes, constructorRes] = await Promise.all([
            fetch(`${API_BASE_URL}/races/${data.race_id}`)
              .then((r) => r.json())
              .catch(() => null),
            fetch(`${API_BASE_URL}/constructors/${data.constructor_id}`)
              .then((r) => r.json())
              .catch(() => null),
          ]);
          setRace(raceRes);
          setConstructorInfo(constructorRes);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [standingId, open]);

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={constructorInfo?.name || "Constructor Standing"}
      loading={loading}
      maxWidth="sm"
    >
      {standing && (
        <ConstructorStandingDetailContent
          standing={standing}
          race={race}
          constructor={constructorInfo}
        />
      )}
    </DetailDialog>
  );
};

const ConstructorStandingFilters = [
  <ReferenceInput key="race" source="race_id" reference="races" alwaysOn>
    <></>
  </ReferenceInput>,
];

export const ConstructorStandingList = () => {
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
          filters={ConstructorStandingFilters}
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
            <ReferenceField source="constructor_id" reference="constructors" />
            <NumberField source="position" />
            <TextField source="position_text" label="Position Text" />
            <NumberField source="points" />
            <NumberField source="wins" />
          </Datagrid>
        </List>
      </Box>
      <ConstructorStandingDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        standingId={selectedId}
      />
    </>
  );
};
