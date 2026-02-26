import { useEffect, useState } from "react";
import { Datagrid, List, TextField, UrlField } from "react-admin";
import { Card, CardContent, Grid, Link, Typography } from "@mui/material";
import { DetailDialog, API_BASE_URL } from "../components";

interface Constructor {
  id: number;
  constructor_ref: string;
  name: string;
  nationality: string;
  url: string;
}

const ConstructorDetailContent = ({
  constructor,
}: {
  constructor: Constructor;
}) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {constructor.name}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Nationality
          </Typography>
          <Typography>{constructor.nationality}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Reference
          </Typography>
          <Typography>{constructor.constructor_ref}</Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" color="textSecondary">
            More Info
          </Typography>
          {constructor.url ? (
            <Link href={constructor.url} target="_blank" rel="noopener">
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

const ConstructorDetailDialog = ({
  open,
  onClose,
  constructorId,
}: {
  open: boolean;
  onClose: () => void;
  constructorId: number | null;
}) => {
  const [constructor, setConstructor] = useState<Constructor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (constructorId && open) {
      setLoading(true);
      fetch(`${API_BASE_URL}/constructors/${constructorId}`)
        .then((res) => res.json())
        .then((data) => {
          setConstructor(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [constructorId, open]);

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={constructor?.name || "Constructor Details"}
      loading={loading}
      maxWidth="sm"
    >
      {constructor && <ConstructorDetailContent constructor={constructor} />}
    </DetailDialog>
  );
};

export const ConstructorList = () => {
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
        >
          <TextField source="id" />
          <TextField source="constructor_ref" label="Reference" />
          <TextField source="name" />
          <TextField source="nationality" />
          <UrlField source="url" />
        </Datagrid>
      </List>
      <ConstructorDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        constructorId={selectedId}
      />
    </>
  );
};
