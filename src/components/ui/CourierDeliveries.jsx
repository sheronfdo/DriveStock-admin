import React, { useState, useEffect } from 'react';
import courierApi from '../../services/courierApi';
import Alert from './Alert';
import LoadingAnimation from '../function/LoadingAnimation';

const CourierDeliveries = () => {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [expandedRow, setExpandedRow] = useState(null); // Track the expanded row

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, filters.status]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await courierApi.getAssignedOrders({ page: pagination.page, limit: pagination.limit });
      console.log('Orders:', response.data);
      setOrders(response.data);
      setPagination((prev) => ({ ...prev, total: response.pagination?.total || response.data.length }));
    } catch (error) {
      setAlert({ type: 'error', message: error.message, onClose: () => setAlert(null) });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, productId, status, reason = '') => {
    setLoading(true);
    try {
      await courierApi.updateOrderStatus(orderId, { status, productId, reason });
      setAlert({ type: 'success', message: 'Order status updated', onClose: () => setAlert(null) });
      fetchOrders();
    } catch (error) {
      setAlert({ type: 'error', message: error.message, onClose: () => setAlert(null) });
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await courierApi.reportDeliveryIssue(selectedOrderId, { productId: selectedProductId, reason: reportReason });
      setAlert({ type: 'success', message: 'Issue reported successfully', onClose: () => setAlert(null) });
      setShowReportModal(false);
      setReportReason('');
      setSelectedOrderId(null);
      fetchOrders();
    } catch (error) {
      setAlert({ type: 'error', message: error.message, onClose: () => setAlert(null) });
    } finally {
      setLoading(false);
    }
  };

  const openReportModal = (orderId, productId) => {
    setSelectedOrderId(orderId);
    setSelectedProductId(productId);
    setShowReportModal(true);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const toggleRow = (orderId) => {
    setExpandedRow(expandedRow === orderId ? null : orderId);
  };

  if (loading) return <LoadingAnimation />;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">My Deliveries</h2>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Filters */}
      <form className="mb-6 bg-[#1A2526] p-4 rounded-lg text-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label text-sm">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="select select-bordered w-full text-black"
            >
              <option value="">All Statuses</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="issueReported">Issue Reported</option>
            </select>
          </div>
        </div>
      </form>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="table w-full bg-[#1A2526] text-white">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Buyer</th>
              <th>Address</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <React.Fragment key={order._id}>
                  <tr
                    onClick={() => toggleRow(order._id)}
                    className="cursor-pointer hover:bg-gray-700"
                  >
                    <td>{order._id}</td>
                    <td>{order.item.courierStatus}</td>
                    <td>{order.buyerId?.name || order.buyerId?._id || 'N/A'}</td>
                    <td>
                      {order.shippingAddress
                        ? `${order.shippingAddress.street}, ${order.shippingAddress.city}`
                        : 'N/A'}
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select
                        value={order.item.courierStatus}
                        onChange={(e) => handleStatusUpdate(order._id, order.item.productId._id, e.target.value)}
                        className="select select-sm select-bordered text-black mr-2"
                        disabled={order.item.courierStatus === 'Delivered'}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Picked Up">Picked Up</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Failed Delivery">Failed Delivery</option>
                      </select>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row expansion when clicking the button
                          openReportModal(order._id, order.item.productId._id);
                        }}
                        disabled={order.item.courierStatus !== 'Out for Delivery'}
                      >
                        Report Issue
                      </button>
                    </td>
                  </tr>
                  {expandedRow === order._id && (
                    <tr>
                      <td colSpan="6" className="p-4 bg-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Buyer Information */}
                          <div>
                            <h3 className="text-lg font-semibold text-blue-400">Buyer Information</h3>
                            <p><strong>Name:</strong> {order.buyerId.name}</p>
                            <p><strong>Email:</strong> {order.buyerId.email}</p>
                            <p><strong>Phone:</strong> {order.buyerId.phone}</p>
                          </div>

                          {/* Item Details */}
                          <div>
                            <h3 className="text-lg font-semibold text-blue-400">Item Details</h3>
                            <p><strong>Product Title:</strong> {order.item.productId.title}</p>
                            <p><strong>Brand:</strong> {order.item.productId.brand}</p>
                            <p><strong>Condition:</strong> {order.item.productId.condition}</p>
                            <p><strong>Quantity:</strong> {order.item.quantity}</p>
                            <p><strong>Price per Unit:</strong> ${order.item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <p><strong>Images:</strong> {order.item.productId.images.length > 0 ? (
                              <a href={order.item.productId.images[0]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                View Image
                              </a>
                            ) : 'N/A'}</p>
                          </div>

                          {/* Shipping Address */}
                          <div>
                            <h3 className="text-lg font-semibold text-blue-400">Shipping Address</h3>
                            <p><strong>Street:</strong> {order.shippingAddress.street}</p>
                            <p><strong>City:</strong> {order.shippingAddress.city}</p>
                            <p><strong>District:</strong> {order.shippingAddress.district}</p>
                            <p><strong>Country:</strong> {order.shippingAddress.country}</p>
                            <p><strong>Postal Code:</strong> {order.shippingAddress.postalCode}</p>
                          </div>

                          {/* Courier Details */}
                          <div>
                            <h3 className="text-lg font-semibold text-blue-400">Courier Details</h3>
                            <p><strong>Courier ID:</strong> {order.item.courierDetails.courierId || 'N/A'}</p>
                            <p><strong>Tracking Number:</strong> {order.item.courierDetails.trackingNumber || 'N/A'}</p>
                            <p><strong>Seller Status:</strong> {order.item.sellerStatus || 'N/A'}</p>
                          </div>

                          {/* Status History */}
                          <div className="col-span-1 md:col-span-2">
                            <h3 className="text-lg font-semibold text-blue-400">Status History</h3>
                            {order.item.statusHistory.length > 0 ? (
                              <ul className="list-disc pl-5">
                                {order.item.statusHistory.map((status, index) => (
                                  <li key={index}>
                                    {status.status} - Updated by {status.updatedBy.role} ({status.updatedBy.userId || 'System'}) on {new Date(status.updatedAt).toLocaleString()}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>No status history available.</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <button
          className="btn btn-primary mr-2"
          disabled={pagination.page === 1}
          onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
        >
          Previous
        </button>
        <span className="text-white">
          Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
        </span>
        <button
          className="btn btn-primary ml-2"
          disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
          onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
        >
          Next
        </button>
      </div>

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-[#1A2526] text-white">
            <h3 className="font-bold text-lg">Report Delivery Issue</h3>
            <form onSubmit={handleReportIssue}>
              <div className="grid grid-cols-1 gap-4">
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the issue"
                  className="textarea textarea-bordered w-full text-black"
                  required
                />
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">Submit</button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierDeliveries;