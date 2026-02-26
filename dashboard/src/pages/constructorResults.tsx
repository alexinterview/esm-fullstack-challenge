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

interface ConstructorResult {
  id: number;
  race_id: number;
  constructor_id: number;
  points: number;
  status: string;
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

const ConstructorResultDetailContent = ({
  result,
  race,
  constructor: constructorInfo,
}: {
  result: ConstructorResult;
  race: RaceInfo | null;
  constructor: ConstructorInfo | null;
}) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {constructorInfo?.name || "Constructor Result"}
      </Typography>
      {race && (
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          {race.name} ({race.year}, Round {race.round})
        </Typography>
      )}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="textSecondary">
                Points
              </Typography>
              <Typography variant="h4">{result.points}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="textSecondary">
                Status
              </Typography>
              <Typography variant="h6">{result.status || "-"}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {constructorInfo && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Nationality
                </Typography>
                <Typography variant="h6">
                  {constructorInfo.nationality}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </CardContent>
  </Card>
);

const ConstructorResultDetailDialog = ({
  open,
  onClose,
  resultId,
}: {
  open: boolean;
  onClose: () => void;
  resultId: number | null;
}) => {
  const [result, setResult] = useState<ConstructorResult | null>(null);
  const [race, setRace] = useState<RaceInfo | null>(null);
  const [constructorInfo, setConstructorInfo] =
    useState<ConstructorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resultId && open) {
      setLoading(true);
      fetch(`${API_BASE_URL}/constructor_results/${resultId}`)
        .then((res) => res.json())
        .then(async (data: ConstructorResult) => {
          setResult(data);
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
  }, [resultId, open]);

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={constructorInfo?.name || "Constructor Result"}
      loading={loading}
      maxWidth="sm"
    >
      {result && (
        <ConstructorResultDetailContent
          result={result}
          race={race}
          constructor={constructorInfo}
        />
      )}
    </DetailDialog>
  );
};

const ConstructorResultFilters = [
  <ReferenceInput key="race" source="race_id" reference="races" alwaysOn>
    <></>
  </ReferenceInput>,
  <ReferenceInput
    key="constructor"
    source="constructor_id"
    reference="constructors"
    alwaysOn
  >
    <></>
  </ReferenceInput>,
];

export const ConstructorResultList = () => {
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
          filters={ConstructorResultFilters}
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
            <NumberField source="points" />
            <TextField source="status" />
          </Datagrid>
        </List>
      </Box>
      <ConstructorResultDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        resultId={selectedId}
      />
    </>
  );
};
