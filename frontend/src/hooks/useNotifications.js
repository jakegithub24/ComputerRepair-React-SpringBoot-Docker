import { useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Hook for managing notifications across the application
 * Provides utility methods to show toasts for various events
 */
export function useNotifications() {
  // Notification for order status updates
  const notifyOrderStatusUpdate = useCallback((orderId, status, message = null) => {
    const statusMessages = {
      Pending: '📋 Order pending - processing...',
      Dispatched: '🚚 Order dispatched! Check tracking...',
      Delivered: '✅ Order delivered! Thank you for shopping',
      Cancelled: '❌ Order cancelled',
    };

    const defaultMsg = statusMessages[status] || `Order updated to ${status}`;
    toast.info(message || defaultMsg, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  // Notification for order creation
  const notifyOrderCreated = useCallback((orderId, message = null) => {
    toast.success(
      message || `✅ New order #${orderId} created! Check admin panel.`,
      {
        position: 'top-right',
        autoClose: 4000,
      }
    );
  }, []);

  // Notification for cart add
  const notifyCartAdded = useCallback((productName, quantity = 1) => {
    toast.success(`🛒 Added ${quantity}x ${productName} to cart`, {
      position: 'bottom-right',
      autoClose: 3000,
    });
  }, []);

  // Notification for cart remove
  const notifyCartRemoved = useCallback((productName) => {
    toast.info(`Removed ${productName} from cart`, {
      position: 'bottom-right',
      autoClose: 2000,
    });
  }, []);

  // Notification for inventory update
  const notifyInventoryUpdate = useCallback((productName, newStock) => {
    if (newStock === 0) {
      toast.warning(`⚠️ ${productName} is now out of stock`, {
        position: 'top-right',
        autoClose: 4000,
      });
    } else if (newStock <= 5) {
      toast.warning(`💛 Only ${newStock} left of ${productName}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  }, []);

  // Notification for new product
  const notifyProductAdded = useCallback((productName, category) => {
    toast.info(`✨ New product: ${productName} (${category})`, {
      position: 'top-right',
      autoClose: 4000,
    });
  }, []);

  // Notification for product removal
  const notifyProductRemoved = useCallback((productName) => {
    toast.warning(`🗑️ ${productName} is no longer available`, {
      position: 'top-right',
      autoClose: 3000,
    });
  }, []);

  // Generic error notification
  const notifyError = useCallback((message, title = 'Error') => {
    toast.error(`${title}: ${message}`, {
      position: 'top-right',
      autoClose: 4000,
    });
  }, []);

  // Generic success notification
  const notifySuccess = useCallback((message, title = 'Success') => {
    toast.success(`${title}: ${message}`, {
      position: 'top-right',
      autoClose: 3000,
    });
  }, []);

  // Generic info notification
  const notifyInfo = useCallback((message) => {
    toast.info(message, {
      position: 'top-right',
      autoClose: 3000,
    });
  }, []);

  return {
    notifyOrderStatusUpdate,
    notifyOrderCreated,
    notifyCartAdded,
    notifyCartRemoved,
    notifyInventoryUpdate,
    notifyProductAdded,
    notifyProductRemoved,
    notifyError,
    notifySuccess,
    notifyInfo,
  };
}
