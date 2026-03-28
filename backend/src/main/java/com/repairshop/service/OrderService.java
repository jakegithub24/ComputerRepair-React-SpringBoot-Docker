package com.repairshop.service;

import com.repairshop.dto.AdminOrderResponse;
import com.repairshop.dto.OrderRequest;
import com.repairshop.dto.PageResponse;
import com.repairshop.exception.InvalidStatusException;
import com.repairshop.exception.ResourceNotFoundException;
import com.repairshop.exception.ValidationException;
import com.repairshop.model.Order;
import com.repairshop.model.User;
import com.repairshop.repository.OrderRepository;
import com.repairshop.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class OrderService {

    private static final Set<String> VALID_SERVICE_TYPES = Set.of("BUY", "SELL", "UPGRADE", "REPAIR");
    private static final Set<String> VALID_ORDER_STATUSES = Set.of("Pending", "In Progress", "Completed", "Cancelled");

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new order for the given user.
     * Validates serviceType (must be BUY/SELL/UPGRADE/REPAIR) and deviceDescription (not blank).
     * Persists with status "Pending" and returns the created order with its ID.
     * Requirements: 6.1, 6.3
     */
    public Order createOrder(Long userId, OrderRequest request) {
        if (request.serviceType() == null || request.serviceType().isBlank()) {
            throw new ValidationException("Service type is required");
        }
        if (!VALID_SERVICE_TYPES.contains(request.serviceType().toUpperCase())) {
            throw new ValidationException("Service type must be one of: BUY, SELL, UPGRADE, REPAIR");
        }
        if (request.deviceDescription() == null || request.deviceDescription().isBlank()) {
            throw new ValidationException("Device description is required");
        }

        Order order = new Order(
                userId,
                request.serviceType().toUpperCase(),
                request.deviceDescription(),
                request.notes(),
                "Pending",
                Instant.now().toString()
        );
        return orderRepository.save(order);
    }

    /**
     * Return only the orders belonging to the authenticated user.
     * Requirements: 8.1
     */
    public List<Order> getOrdersForUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    /**
     * Return a paginated list of all orders across all users, including the submitting username.
     * Requirements: 12.1
     */
    public PageResponse<AdminOrderResponse> listAllOrders(int page, int size) {
        List<Order> all = new ArrayList<>();
        orderRepository.findAll().forEach(all::add);
        long total = all.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIndex = page * size;
        int toIndex = (int) Math.min(fromIndex + size, total);

        List<AdminOrderResponse> content = (fromIndex >= total)
                ? List.of()
                : all.subList(fromIndex, toIndex).stream()
                        .map(o -> {
                            String username = userRepository.findById(o.getUserId())
                                    .map(User::getUsername).orElse("unknown");
                            return new AdminOrderResponse(o.getId(), o.getUserId(), username,
                                    o.getServiceType(), o.getDeviceDescription(), o.getNotes(),
                                    o.getStatus(), o.getCreatedAt());
                        })
                        .toList();

        return new PageResponse<>(content, page, size, total, totalPages);
    }

    /**
     * Update the status of an order (admin only).
     * Validates status value; throws InvalidStatusException (400) if invalid.
     * Throws ResourceNotFoundException (404) if order not found.
     * Requirements: 12.3, 12.5
     */
    public Order updateOrderStatus(Long orderId, String status) {
        if (status == null || !VALID_ORDER_STATUSES.contains(status)) {
            throw new InvalidStatusException(
                    "Invalid order status. Valid values: Pending, In Progress, Completed, Cancelled");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        order.setStatus(status);
        return orderRepository.save(order);
    }
}
