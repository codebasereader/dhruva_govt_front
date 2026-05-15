import { useState } from "react";
import { deleteUser, getUsers } from "../../../api/user";
import { getApiErrorMessage } from "../../../api/utils";
import AdminListPage from "../../../components/common/AdminListPage";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable from "../../../components/common/DataTable";
import Drawer from "../../../components/common/Drawer";
import TableActions from "../../../components/common/TableActions";
import { useFetchList } from "../../../hooks/useFetchList";
import { formatRole, getEntityId } from "../../../utils/entity";
import AddEditUser from "./AddEditUser";

function ViewUser() {
  const {
    data: users,
    loading,
    error: listError,
    reload: loadUsers,
    setError: setListError,
  } = useFetchList(getUsers, "Failed to load users.");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditingUser(null);
    setDrawerOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(getEntityId(deleteTarget));
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      setListError(getApiErrorMessage(err, "Failed to delete user."));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: "name", label: "Name", render: (row) => row.name ?? "—" },
    { key: "email", label: "Email", render: (row) => row.email ?? "—" },
    { key: "role", label: "Role", render: (row) => formatRole(row.role) },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={
            row.isActive === false
              ? "text-zinc-400"
              : "font-medium text-emerald-600"
          }
        >
          {row.isActive === false ? "Inactive" : "Active"}
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminListPage
        title="Users"
        description="Manage admin and owner accounts."
        addLabel="Add user"
        onAdd={openCreate}
      >
        {listError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </p>
        ) : null}

        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="No users yet. Add your first user."
          rowKey={(row) => getEntityId(row)}
          renderActions={(row) => (
            <TableActions
              onEdit={() => openEdit(row)}
              onDelete={() => setDeleteTarget(row)}
            />
          )}
        />
      </AdminListPage>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingUser ? "Edit user" : "Add user"}
        description={
          editingUser
            ? "Update account details."
            : "Create a new admin or owner account."
        }
      >
        <AddEditUser
          user={editingUser}
          onSuccess={() => {
            closeDrawer();
            loadUsers();
          }}
          onCancel={closeDrawer}
        />
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? deleteTarget?.email}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}

export default ViewUser;
