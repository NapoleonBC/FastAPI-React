import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MaterialReactTable,
  type MaterialReactTableProps,
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row,
} from 'material-react-table';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

export type Machine = {
  id: string;
  name: string;
  location: string;
  email: string;
  number: string;
  enum: string;
};

const Machine = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState({ columns: [], data: [] });
  const [headCells, setHeadCells] = useState([]);
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string;
  }>({});

  const handleCreateNewRow = (values: Machine) => {
    fetch('/api/machine', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: values.name,
        location: values.location,
        email: values.email,
        number: values.number,
        enum: values.enum === "Active" ? true : false
      })
    }).then(async (res) => {
      const newData = await res.json()
      tableData.push({
        ...newData.machine_info,
        enum: newData.machine_info.enum ? "Active" : "Not Active"
      });
      setTableData([...tableData]);
    })

  };

  const handleSaveRowEdits: MaterialReactTableProps<Machine>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        fetch(`/api/machine/${values.id}`, {
          method: 'PUT',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(values)
        }).then((res) => {
          if (res.status === 200) {
            tableData[row.index] = values;
            setTableData([...tableData]);
            exitEditingMode();
          }
        })
      }
    };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRow = useCallback(
    (row: MRT_Row<Machine>) => {
      if (
        !confirm(`Are you sure you want to delete ${row.getValue('name')}`)
      ) {
        return;
      }
      fetch(`/api/machine/${row.getValue('id')}`, {
        method: 'DELETE'
      }).then((res) => {
        if (res.status === 200) {
          tableData.splice(row.index, 1);
          setTableData([...tableData]);
        }
      })
    },
    [tableData],
  );

  useEffect(() => {
    fetch('/api/machine').then(async (res) => {
      const data = await res.json() // [{}]
      setTableData(data.map((item: any) => ({
        ...item,
        enum: item.enum ? "Active" : "Not Active"
      })));
      //console.log(tableData)
      if (data.length > 0) {
        const headCells = Object.keys(data[0]).map((key) => ({
          accessorKey: key,
          header: key.toUpperCase(),
          enableColumnOrdering: false,
          enableEditing: true,
          enableSorting: true,
          size: 100,
          muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
            ...getCommonEditTextFieldProps(cell),
          }),
        }));
        setHeadCells(headCells);
      }
    })
  }, []);



  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<Machine>,
    ): MRT_ColumnDef<Machine>['muiTableBodyCellEditTextFieldProps'] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event: any) => {
          const isValid = validateRequired(event.target.value);
          if (!isValid) {
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`,
            });
          } else {
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors],
  );

  // const columns = useMemo<MRT_ColumnDef<Machine>[]>(
  //   () => [
  //     {
  //       accessorKey: 'id',
  //       header: 'ID',
  //       enableColumnOrdering: false,
  //       enableEditing: false,
  //       enableSorting: false,
  //       size: 50,
  //     },
  //     {
  //       accessorKey: 'name',
  //       header: 'Name',
  //       size: 100,
  //       muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
  //         ...getCommonEditTextFieldProps(cell),
  //       }),
  //     },
  //     {
  //       accessorKey: 'location',
  //       header: 'Location',
  //       size: 100,
  //       muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
  //         ...getCommonEditTextFieldProps(cell),
  //       }),
  //     },
  //     {
  //       accessorKey: 'email',
  //       header: 'Email',
  //       enableEditing: false,
  //     },
  //     {
  //       accessorKey: 'number',
  //       header: 'Number',
  //       enableEditing: false,
  //     },
  //     {
  //       accessorKey: 'enum',
  //       header: 'Enum',
  //       size: 80,
  //       enableEditing: false,
  //     },
  //   ],
  //   [getCommonEditTextFieldProps],
  // );
  return (
    <>
      <MaterialReactTable
        displayColumnDefOptions={{
          'mrt-row-actions': {
            muiTableHeadCellProps: {
              align: 'center',
            },
            size: 120,
          },
        }}
        columns={headCells}
        data={tableData}
        editingMode="modal" //default
        enableColumnOrdering
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <Tooltip arrow placement="left" title="Edit">
              <IconButton onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement="right" title="Delete">
              <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        renderTopToolbarCustomActions={() => (
          <Button
            color="secondary"
            onClick={() => setCreateModalOpen(true)}
            variant="contained"
          >
            Create New Machine
          </Button>
        )}
      />
      <CreateNewMachineModal
        columns={headCells}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </>
  );
};

interface CreateModalProps {
  columns: MRT_ColumnDef<Machine>[];
  onClose: () => void;
  onSubmit: (values: Machine) => void;
  open: boolean;
}

export const CreateNewMachineModal = ({
  open,
  columns,
  onClose,
  onSubmit,
}: CreateModalProps) => {
  const [values, setValues] = useState<any>(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ''] = column.accessorKey === 'enum' ? 'Active' : '';
      return acc;
    }, {} as any),
  );


  const handleSubmit = () => {
    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Create New Machine</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem',
            }}
          >
            {columns.filter((column) => column.header !== "ID").map((column) => (
              column.accessorKey === 'enum' ?
                <FormControl key={column.accessorKey}>
                  <InputLabel>{column.header}</InputLabel>
                  <Select
                    variant='standard'
                    label={column.header}
                    name={column.accessorKey}
                    value={values[column.accessorKey]}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        [e.target.name]: e.target.value,
                      })
                    }
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Not Active">Not Active</MenuItem>
                  </Select>
                </FormControl>
                :
                <TextField
                  variant='standard'
                  key={column.accessorKey}
                  label={column.header}
                  name={column.accessorKey}
                  onChange={(e) => setValues({ ...values, [e.target.name]: e.target.value })}
                />
            ))}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="secondary" onClick={handleSubmit} variant="contained">
          Create New Machine
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const validateRequired = (value: string) => !!value.length;

export default Machine;
