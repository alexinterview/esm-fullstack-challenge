import { useEffect, useState } from "react";
import { Datagrid, List, NumberField, TextField, UrlField } from "react-admin";
import { Card, CardContent, Grid, Link, Typography } from "@mui/material";
import { DetailDialog, API_BASE_URL } from "../components";

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

const CircuitDetailContent = ({ circuit }: { circuit: Circuit }) => (
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
            Reference
          </Typography>
          <Typography>{circuit.circuit_ref}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Coordinates
          </Typography>
          <Typography>
            {circuit.lat}, {circuit.lng}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Altitude
          </Typography>
          <Typography>{circuit.alt}m</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Map
          </Typography>
          <Link
            href={`https://www.google.com/maps?q=${circuit.lat},${circuit.lng}`}
            target="_blank"
            rel="noopener"
          >
            View on Maps
          </Link>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" color="textSecondary">
            More Info
          </Typography>
          {circuit.url ? (
            <Link href={circuit.url} target="_blank" rel="noopener">
              Wikipedia
            </Link>
          ) : (
            <Typography>-</Typography>
          )}
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const CircuitDetailDialog = ({
  open,
  onClose,
  circuitId,
}: {
  open: boolean;
  onClose: () => void;
  circuitId: number | null;
}) => {
  const [circuit, setCircuit] = useState<Circuit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (circuitId && open) {
      setLoading(true);
      fetch(`${API_BASE_URL}/circuits/${circuitId}`)
        .then((res) => res.json())
        .then((data) => {
          setCircuit(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [circuitId, open]);

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={circuit?.name || "Circuit Details"}
      loading={loading}
      maxWidth="sm"
    >
      {circuit && <CircuitDetailContent circuit={circuit} />}
    </DetailDialog>
  );
};

export const CircuitList = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRowClick = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  return (
    <>
      <List>
        <Datagrid
          rowClick={(id) => {
            handleRowClick(id as number);
            return false;
          }}
          sx={{
            "& .column-url": {
              maxWidth: 180,
              "& a": {
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            },
          }}
        >
          <TextField source="id" />
          <TextField source="circuit_ref" label="Reference" />
          <TextField source="name" />
          <TextField source="location" />
          <TextField source="country" />
          <NumberField source="lat" label="Latitude" />
          <NumberField source="lng" label="Longitude" />
          <NumberField source="alt" label="Altitude" />
          <UrlField source="url" />
        </Datagrid>
      </List>
      <CircuitDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        circuitId={selectedId}
      />
    </>
  );
};
