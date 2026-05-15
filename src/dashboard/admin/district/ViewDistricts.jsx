import { useState } from "react";
// import { deleteDistrict, getDistricts } from "../../../api/district";
import { getDistricts } from "../../../api/district";
import AdminListPage from "../../../components/common/AdminListPage";
// import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable from "../../../components/common/DataTable";
import Drawer from "../../../components/common/Drawer";
import TableActions from "../../../components/common/TableActions";
import { useFetchList } from "../../../hooks/useFetchList";
import { getEntityId } from "../../../utils/entity";
import AddEditDistrict from "./AddEditDistrict";

function ViewDistricts() {
  const {
    data: districts,
    loading,
    error: listError,
    reload: load,
  } = useFetchList(getDistricts, "Failed to load districts.");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  // const [deleteTarget, setDeleteTarget] = useState(null);
  // const [deleting, setDeleting] = useState(false);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  // const handleDelete = async () => {
  //   if (!deleteTarget) return;
  //   setDeleting(true);
  //   try {
  //     await deleteDistrict(getEntityId(deleteTarget));
  //     setDeleteTarget(null);
  //     await load();
  //   } catch (err) {
  //     setListError(getApiErrorMessage(err, "Failed to delete district."));
  //     setDeleteTarget(null);
  //   } finally {
  //     setDeleting(false);
  //   }
  // };

  const columns = [
    { key: "name", label: "Name", render: (row) => row.name ?? "—" },
  ];

  return (
    <>
      <AdminListPage
        title="Districts"
        description="Manage districts."
        addLabel="Add district"
        onAdd={() => {
          setEditing(null);
          setDrawerOpen(true);
        }}
      >
        {listError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </p>
        ) : null}

        <DataTable
          columns={columns}
          data={districts}
          loading={loading}
          emptyMessage="No districts yet."
          rowKey={(row) => getEntityId(row)}
          renderActions={(row) => (
            <TableActions
              onEdit={() => {
                setEditing(row);
                setDrawerOpen(true);
              }}
              // onDelete={() => setDeleteTarget(row)}
            />
          )}
        />
      </AdminListPage>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit district" : "Add district"}
      >
        <AddEditDistrict
          district={editing}
          onSuccess={() => {
            closeDrawer();
            load();
          }}
          onCancel={closeDrawer}
        />
      </Drawer>

      {/* <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete district"
        message={`Delete "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      /> */}
    </>
  );
}

export default ViewDistricts;
