import { useEffect, useState } from "react";
import { Datagrid, List, TextField } from "react-admin";
import { Card, CardContent, Grid, Typography } from "@mui/material";
import { DetailDialog, API_BASE_URL } from "../components";

interface Status {
  id: number;
  status: string;
}

const StatusDetailContent = ({ status }: { status: Status }) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        Status Details
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <Typography variant="subtitle2" color="textSecondary">
            ID
          </Typography>
          <Typography>{status.id}</Typography>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Status
          </Typography>
          <Typography>{status.status}</Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const StatusDetailDialog = ({
  open,
  onClose,
  statusId,
}: {
  open: boolean;
  onClose: () => void;
  statusId: number | null;
}) => {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (statusId && open) {
      setLoading(true);
      fetch(`${API_BASE_URL}/status/${statusId}`)
        .then((res) => res.json())
        .then((data) => {
          setStatus(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [statusId, open]);

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={status?.status || "Status Details"}
      loading={loading}
      maxWidth="xs"
    >
      {status && <StatusDetailContent status={status} />}
    </DetailDialog>
  );
};

export const StatusList = () => {
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
          <TextField source="status" />
        </Datagrid>
      </List>
      <StatusDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        statusId={selectedId}
      />
    </>
  );
};
