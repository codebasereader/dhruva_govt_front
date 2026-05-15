import { useState } from "react";
// import { deleteDepartment, getDepartments } from "../../../api/department";
import { getDepartments } from "../../../api/department";
import AdminListPage from "../../../components/common/AdminListPage";
// import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable from "../../../components/common/DataTable";
import Drawer from "../../../components/common/Drawer";
import TableActions from "../../../components/common/TableActions";
import { useFetchList } from "../../../hooks/useFetchList";
import { getEntityId } from "../../../utils/entity";
import AddEditDepartment from "./AddEditDepartment";

function ViewDepartments() {
  const {
    data: departments,
    loading,
    error: listError,
    reload: load,
  } = useFetchList(getDepartments, "Failed to load departments.");

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
  //     await deleteDepartment(getEntityId(deleteTarget));
  //     setDeleteTarget(null);
  //     await load();
  //   } catch (err) {
  //     setListError(getApiErrorMessage(err, "Failed to delete department."));
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
        title="Departments"
        description="Manage departments."
        addLabel="Add department"
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
          data={departments}
          loading={loading}
          emptyMessage="No departments yet."
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
        title={editing ? "Edit department" : "Add department"}
      >
        <AddEditDepartment
          department={editing}
          onSuccess={() => {
            closeDrawer();
            load();
          }}
          onCancel={closeDrawer}
        />
      </Drawer>

      {/* <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete department"
        message={`Delete "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      /> */}
    </>
  );
}

export default ViewDepartments;
