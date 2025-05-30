import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import PageContainer from './PageContainer';
import Table from './Table';
import ConfirmationModal from './ConfirmationModal';
import LoadingAnimation from '../function/LoadingAnimation';

const AdminAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // Match the itemsPerPage prop passed to Table
    total: 0,
  });
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, adminId: null });

  useEffect(() => {
    fetchAdmins();
  }, [pagination.page]); // Fetch admins when the page changes

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      const res = await adminApi.getAllAdmins(params); // Updated to pass pagination params
      if (!res.success || !Array.isArray(res.data)) {
        throw new Error("Invalid admins data received.");
      }
      setAdmins(res.data);
      setPagination((prev) => ({
        ...prev,
        total: res.pagination.total, // Update total based on API response
      }));
    } catch (error) {
      setAlert({ type: 'error', message: error.message, onClose: () => setAlert(null) });
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ email: '', password: '', name: '', phone: '' });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      await adminApi.createAdmin(formData);
      setAlert({ type: 'success', message: 'Admin created successfully', onClose: () => setAlert(null) });
      setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 after creating a new admin
      await fetchAdmins(); // Immediate refetch for latest data
      setModalOpen(false);
    } catch (error) {
      setAlert({ type: 'error', message: error.message, onClose: () => setAlert(null) });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (admin) => {
    setConfirmModal({ isOpen: true, adminId: admin._id });
  };

  const confirmDelete = async () => {
    if (!confirmModal.adminId) return;
    setLoading(true);
    try {
      await adminApi.deleteAdmin(confirmModal.adminId);
      setAlert({ type: 'success', message: 'Admin deleted successfully', onClose: () => setAlert(null) });
      setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 after deletion
      await fetchAdmins(); // Immediate refetch for latest data
    } catch (error) {
      setAlert({ type: 'error', message: error.message, onClose: () => setAlert(null) });
    } finally {
      setLoading(false);
      setConfirmModal({ isOpen: false, adminId: null });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > Math.ceil(pagination.total / pagination.limit)) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone', hideOnMobile: true },
    { key: 'status', label: 'Status', hideOnMobile: true },
  ];

  const actions = [
    {
      label: 'Delete',
      onClick: handleDelete,
      className: 'btn-error text-white',
    },
  ];

  return (
    <PageContainer title="Manage Admins" alert={alert}>
      {loading && <LoadingAnimation />}
      {!loading && (
        <>
          <button
            onClick={openCreateModal}
            className="btn btn-primary mb-4 bg-highlight-orange border-none hover:bg-orange-600"
          >
            Add Admin
          </button>

          {modalOpen && (
            <dialog open className="modal">
              <div className="modal-box bg-[#1A2526] text-white max-w-md mx-auto p-4 sm:p-6">
                <h3 className="font-bold text-lg sm:text-xl mb-4">Create Admin</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label text-sm sm:text-base">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input input-bordered w-full text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-sm sm:text-base">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input input-bordered w-full text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-sm sm:text-base">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input input-bordered w-full text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-sm sm:text-base">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input input-bordered w-full text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="modal-action flex justify-between">
                    <button
                      type="submit"
                      className="btn bg-highlight-teal border-none hover:bg-teal-600 text-sm sm:text-base"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost text-sm sm:text-base"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </dialog>
          )}

          <ConfirmationModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal({ isOpen: false, adminId: null })}
            onConfirm={confirmDelete}
            title="Confirm Delete"
            message="Are you sure you want to delete this admin?"
            confirmText="Delete"
            cancelText="Cancel"
          />

          <Table
            data={admins}
            columns={columns}
            actions={actions}
            loading={loading}
            emptyMessage="No admins found."
            itemsPerPage={pagination.limit} // Use pagination.limit to stay consistent
          />

          {/* Pagination Controls */}
          {pagination.total > 0 && (
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn bg-highlight-teal border-none hover:bg-teal-600 text-white"
              >
                Previous
              </button>
              <span className="self-center text-white">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="btn bg-highlight-teal border-none hover:bg-teal-600 text-white"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default AdminAdmins;