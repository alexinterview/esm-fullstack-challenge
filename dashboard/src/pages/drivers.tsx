import { useEffect, useState } from "react";
import {
  CreateBase,
  Datagrid,
  DateField,
  Edit,
  EditBase,
  Form,
  List,
  SaveButton,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  UrlField,
  maxLength,
  minLength,
  regex,
  required,
  useDelete,
  useListContext,
  useNotify,
  useRedirect,
  useRefresh,
  useResourceContext,
} from "react-admin";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogTitle,
  Fab,
  Grid,
  IconButton,
  Link,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { DetailDialog, API_BASE_URL } from "../components";

interface Driver {
  id: number;
  driver_ref: string;
  number: string;
  code: string;
  forename: string;
  surname: string;
  dob: string;
  nationality: string;
  url: string;
}

const validateDriverRef = [
  minLength(2, "Must be at least 2 characters"),
  maxLength(50, "Must be 50 characters or less"),
  regex(/^[a-z_]+$/, "Must be lowercase letters and underscores only"),
];

const validateNumber = [regex(/^\d{1,3}$/, "Must be 1-3 digits")];

const validateCode = [
  regex(/^[A-Z]{3}$/, "Must be exactly 3 uppercase letters"),
];

const validateName = [
  required("This field is required"),
  minLength(1, "Must be at least 1 character"),
  maxLength(100, "Must be 100 characters or less"),
];

const validateDob = [
  required("Date of birth is required"),
  regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)"),
];

const validateNationality = [
  required("Nationality is required"),
  minLength(2, "Must be at least 2 characters"),
  maxLength(50, "Must be 50 characters or less"),
];

const validateUrl = [
  regex(
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    "Must be a valid URL",
  ),
];

const CreateDriverDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const notify = useNotify();
  const redirect = useRedirect();
  const resource = useResourceContext();

  const handleSuccess = () => {
    notify("Driver created successfully");
    redirect("list", resource);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Create Driver
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <CreateBase
        resource="drivers"
        mutationOptions={{ onSuccess: handleSuccess }}
      >
        <Form>
          <Card>
            <CardContent>
              <TextInput
                source="driver_ref"
                validate={validateDriverRef}
                fullWidth
                helperText="Lowercase letters and underscores only"
              />
              <TextInput
                source="number"
                validate={validateNumber}
                fullWidth
                helperText="1-3 digit number"
              />
              <TextInput
                source="code"
                validate={validateCode}
                fullWidth
                helperText="3 uppercase letters (e.g., HAM)"
              />
              <TextInput source="forename" validate={validateName} fullWidth />
              <TextInput source="surname" validate={validateName} fullWidth />
              <TextInput
                source="dob"
                type="date"
                validate={validateDob}
                fullWidth
              />
              <TextInput
                source="nationality"
                validate={validateNationality}
                fullWidth
              />
              <TextInput
                source="url"
                validate={validateUrl}
                fullWidth
                helperText="e.g., https://example.com"
              />
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
              <Button onClick={onClose}>Cancel</Button>
              <SaveButton />
            </CardActions>
          </Card>
        </Form>
      </CreateBase>
    </Dialog>
  );
};

const EditDriverDialog = ({
  open,
  onClose,
  driverId,
}: {
  open: boolean;
  onClose: () => void;
  driverId: number | null;
}) => {
  const notify = useNotify();
  const refresh = useRefresh();

  const handleSuccess = () => {
    notify("Driver updated successfully");
    refresh();
    onClose();
  };

  if (!driverId) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Edit Driver
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <EditBase
        resource="drivers"
        id={driverId}
        mutationMode="pessimistic"
        mutationOptions={{ onSuccess: handleSuccess }}
      >
        <Form>
          <Card>
            <CardContent>
              <TextInput
                source="driver_ref"
                validate={validateDriverRef}
                fullWidth
                helperText="Lowercase letters and underscores only"
              />
              <TextInput
                source="number"
                validate={validateNumber}
                fullWidth
                helperText="1-3 digit number"
              />
              <TextInput
                source="code"
                validate={validateCode}
                fullWidth
                helperText="3 uppercase letters (e.g., HAM)"
              />
              <TextInput source="forename" validate={validateName} fullWidth />
              <TextInput source="surname" validate={validateName} fullWidth />
              <TextInput
                source="dob"
                type="date"
                validate={validateDob}
                fullWidth
              />
              <TextInput
                source="nationality"
                validate={validateNationality}
                fullWidth
              />
              <TextInput
                source="url"
                validate={validateUrl}
                fullWidth
                helperText="e.g., https://example.com"
              />
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
              <Button onClick={onClose}>Cancel</Button>
              <SaveButton />
            </CardActions>
          </Card>
        </Form>
      </EditBase>
    </Dialog>
  );
};

const DriverDetailContent = ({ driver }: { driver: Driver }) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {driver.forename} {driver.surname}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Code
          </Typography>
          <Typography>{driver.code || "-"}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Number
          </Typography>
          <Typography>{driver.number || "-"}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Nationality
          </Typography>
          <Typography>{driver.nationality}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Date of Birth
          </Typography>
          <Typography>{driver.dob}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Reference
          </Typography>
          <Typography>{driver.driver_ref}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Typography variant="subtitle2" color="textSecondary">
            More Info
          </Typography>
          {driver.url ? (
            <Link href={driver.url} target="_blank" rel="noopener">
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

const DriverDetailDialog = ({
  open,
  onClose,
  driverId,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  driverId: number | null;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (driverId && open) {
      setLoading(true);
      fetch(`${API_BASE_URL}/drivers/${driverId}`)
        .then((res) => res.json())
        .then((data) => {
          setDriver(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [driverId, open]);

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={driver ? `${driver.forename} ${driver.surname}` : "Driver Details"}
      loading={loading}
      maxWidth="sm"
      actions={
        driverId && (
          <>
            <Button
              startIcon={<EditIcon />}
              onClick={() => onEdit(driverId)}
              color="primary"
            >
              Edit
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(driverId)}
              color="error"
            >
              Delete
            </Button>
          </>
        )
      }
    >
      {driver && <DriverDetailContent driver={driver} />}
    </DetailDialog>
  );
};

const DriverFabs = () => {
  const [open, setOpen] = useState(false);
  const redirect = useRedirect();
  const refresh = useRefresh();
  const notify = useNotify();
  const { selectedIds, onUnselectItems } = useListContext();
  const [deleteOne] = useDelete();

  const handleDelete = () => {
    if (selectedIds.length !== 1) return;
    deleteOne(
      "drivers",
      { id: selectedIds[0] },
      {
        onSuccess: () => {
          notify("Driver deleted successfully");
          onUnselectItems();
          refresh();
        },
        onError: () => {
          notify("Error deleting driver", { type: "error" });
        },
      },
    );
  };

  return (
    <>
      {selectedIds.length === 1 && (
        <>
          <Fab
            color="error"
            aria-label="delete"
            onClick={handleDelete}
            sx={{
              position: "fixed",
              bottom: 152,
              right: 24,
            }}
          >
            <DeleteIcon />
          </Fab>
          <Fab
            color="secondary"
            aria-label="edit"
            onClick={() => redirect("edit", "drivers", selectedIds[0])}
            sx={{
              position: "fixed",
              bottom: 88,
              right: 24,
            }}
          >
            <EditIcon />
          </Fab>
        </>
      )}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>
      <CreateDriverDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const DriverListContent = ({
  onRowClick,
}: {
  onRowClick: (id: number) => void;
}) => (
  <>
    <Datagrid
      rowClick={(id) => {
        onRowClick(id as number);
        return false;
      }}
    >
      <TextField source="id" />
      <TextField source="driver_ref" />
      <TextField source="number" />
      <TextField source="code" />
      <TextField source="forename" />
      <TextField source="surname" />
      <DateField source="dob" />
      <TextField source="nationality" />
      <UrlField source="url" />
    </Datagrid>
    <DriverFabs />
  </>
);

export const DriverList = () => {
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const refresh = useRefresh();
  const notify = useNotify();
  const [deleteOne] = useDelete();

  const handleRowClick = (id: number) => {
    setSelectedDriverId(id);
    setDetailDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    setDetailDialogOpen(false);
    setSelectedDriverId(id);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedDriverId(null);
  };

  const handleDelete = (id: number) => {
    deleteOne(
      "drivers",
      { id },
      {
        onSuccess: () => {
          notify("Driver deleted successfully");
          setDetailDialogOpen(false);
          refresh();
        },
        onError: () => {
          notify("Error deleting driver", { type: "error" });
        },
      },
    );
  };

  return (
    <>
      <List>
        <DriverListContent onRowClick={handleRowClick} />
      </List>
      <DriverDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        driverId={selectedDriverId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <EditDriverDialog
        open={editDialogOpen}
        onClose={handleEditClose}
        driverId={selectedDriverId}
      />
    </>
  );
};

export const DriverShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="driver_ref" />
      <DateField source="number" />
      <TextField source="code" />
      <TextField source="forename" />
      <TextField source="surname" />
      <DateField source="dob" />
      <TextField source="nationality" />
      <UrlField source="url" />
    </SimpleShowLayout>
  </Show>
);

export const DriverEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput
        source="driver_ref"
        validate={validateDriverRef}
        fullWidth
        helperText="Lowercase letters and underscores only"
      />
      <TextInput
        source="number"
        validate={validateNumber}
        fullWidth
        helperText="1-3 digit number"
      />
      <TextInput
        source="code"
        validate={validateCode}
        fullWidth
        helperText="3 uppercase letters (e.g., HAM)"
      />
      <TextInput source="forename" validate={validateName} fullWidth />
      <TextInput source="surname" validate={validateName} fullWidth />
      <TextInput source="dob" type="date" validate={validateDob} fullWidth />
      <TextInput
        source="nationality"
        validate={validateNationality}
        fullWidth
      />
      <TextInput
        source="url"
        validate={validateUrl}
        fullWidth
        helperText="e.g., https://example.com"
      />
    </SimpleForm>
  </Edit>
);
