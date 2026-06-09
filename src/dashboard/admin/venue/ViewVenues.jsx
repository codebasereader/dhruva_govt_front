import { useCallback, useEffect, useState } from "react";
import { deleteVenue, getVenues } from "../../../api/venue";
import { getApiErrorMessage } from "../../../api/utils";
import AdminListPage from "../../../components/common/AdminListPage";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/common/Modal";
import TableActions from "../../../components/common/TableActions";
import { useFetchList } from "../../../hooks/useFetchList";
import { getEntityId } from "../../../utils/entity";
import AddEditVenue from "./AddEditVenue";

function venueLabel(row) {
  return row?.name?.trim() || row?.address?.trim() || "this venue";
}

function ViewVenues() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(id);
  }, [search]);

  const fetchVenues = useCallback(
    () => getVenues(debouncedSearch ? { search: debouncedSearch } : {}),
    [debouncedSearch],
  );

  const {
    data: venues,
    loading,
    error: listError,
    reload: load,
    setError: setListError,
  } = useFetchList(fetchVenues, "Failed to load venues.");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVenue(getEntityId(deleteTarget));
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setListError(getApiErrorMessage(err, "Failed to delete venue."));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: "name", label: "Name", render: (row) => row.name?.trim() || "—" },
    { key: "address", label: "Address", render: (row) => row.address?.trim() || "—" },
  ];

  return (
    <>
      <AdminListPage
        title="Venues"
        description="Manage venues used across business plans and bookings."
        addLabel="Add venue"
        onAdd={openAdd}
      >
        {listError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </p>
        ) : null}

        <div className="mb-4 max-w-md">
          <label htmlFor="venue-search" className="mb-1 block text-xs font-medium text-zinc-600">
            Search venues
          </label>
          <input
            id="venue-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or address…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
          />
        </div>

        <DataTable
          columns={columns}
          data={venues}
          loading={loading}
          emptyMessage={debouncedSearch ? "No venues match your search." : "No venues yet."}
          rowKey={(row) => getEntityId(row)}
          renderActions={(row) => (
            <TableActions
              onEdit={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              onDelete={() => setDeleteTarget(row)}
            />
          )}
        />
      </AdminListPage>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit venue" : "Add venue"}
        size="sm"
      >
        <AddEditVenue
          venue={editing}
          onSuccess={() => {
            closeModal();
            load();
          }}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete venue"
        message={`Are you sure you want to delete "${venueLabel(deleteTarget)}"? This cannot be undone.`}
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}

export default ViewVenues;
