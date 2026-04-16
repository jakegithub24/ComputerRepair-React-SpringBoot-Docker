package com.repairshop.service;

import com.repairshop.dto.AdminOrderResponse;
import com.repairshop.dto.OrderItemResponse;
import com.repairshop.dto.PageResponse;
import com.repairshop.exception.InvalidStatusException;
import com.repairshop.exception.ResourceNotFoundException;
import com.repairshop.exception.ValidationException;
import com.repairshop.model.CartItem;
import com.repairshop.model.CatalogueItem;
import com.repairshop.model.Order;
import com.repairshop.model.OrderItem;
import com.repairshop.model.User;
import com.repairshop.repository.CartItemRepository;
import com.repairshop.repository.CatalogueItemRepository;
import com.repairshop.repository.OrderItemRepository;
import com.repairshop.repository.OrderRepository;
import com.repairshop.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class OrderService {

    private static final Set<String> VALID_ORDER_STATUSES = Set.of("Pending", "Dispatched", "Delivered", "Cancelled");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final CatalogueItemRepository catalogueItemRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    private final SimpMessagingTemplate messagingTemplate;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        CartItemRepository cartItemRepository,
                        CatalogueItemRepository catalogueItemRepository,
                        UserRepository userRepository,
                        ProductService productService,
                        SimpMessagingTemplate messagingTemplate) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.catalogueItemRepository = catalogueItemRepository;
        this.userRepository = userRepository;
        this.productService = productService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Create order from cart for the given user.
     * Validates cart is not empty and has products with sufficient stock.
     * Reduces product inventory and clears user's cart.
     * Requirements: E-Commerce flow
     */
    public Order createOrderFromCart(Long userId, String shippingAddress) {
        if (shippingAddress == null || shippingAddress.isBlank()) {
            throw new ValidationException("Shipping address is required");
        }

        // Get cart items
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new ValidationException("Cart is empty. Add items before placing order");
        }

        // Calculate total and verify stock
        double totalPrice = 0;
        List<OrderItemData> orderItemsData = new ArrayList<>();

        for (CartItem cartItem : cartItems) {
            CatalogueItem product = catalogueItemRepository.findByProductId(cartItem.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + cartItem.getProductId()));

            if (product.getStock() < cartItem.getQuantity()) {
                throw new ValidationException("Insufficient stock for product: " + product.getName() + 
                        ". Available: " + product.getStock());
            }

            double itemTotal = product.getPrice() * cartItem.getQuantity();
            totalPrice += itemTotal;
            orderItemsData.add(new OrderItemData(
                    cartItem.getProductId(),
                    cartItem.getQuantity(),
                    product.getPrice()
            ));
        }

        // Create order
        String now = Instant.now().toString();
        Order order = new Order(userId, totalPrice, shippingAddress, "Pending", now);
        Order savedOrder = orderRepository.save(order);

        // Create order items and reduce stock
        for (OrderItemData itemData : orderItemsData) {
            OrderItem orderItem = new OrderItem(
                    savedOrder.getId(),
                    itemData.productId,
                    itemData.quantity,
                    itemData.priceAtPurchase,
                    now
            );
            orderItemRepository.save(orderItem);
            productService.reduceStock(itemData.productId, itemData.quantity);
        }

        // Clear cart
        cartItemRepository.deleteByUserId(userId);

        // Notify admin
        String username = userRepository.findById(userId).map(User::getUsername).orElse("unknown");
        messagingTemplate.convertAndSend("/topic/admin/orders",
                new AdminOrderResponse(savedOrder.getId(), savedOrder.getUserId(), username,
                        totalPrice, shippingAddress, savedOrder.getStatus(), savedOrder.getCreatedAt()));

        return savedOrder;
    }

    /**
     * Return only the orders belonging to the authenticated user with order items.
     * Requirements: E-Commerce user dashboard
     */
    public List<Order> getOrdersForUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    /**
     * Get order details with items
     */
    public Order getOrderWithItems(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
    }

    /**
     * Get order items for an order
     */
    public List<OrderItemResponse> getOrderItems(Long orderId) {
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        return items.stream()
                .map(item -> {
                    CatalogueItem product = catalogueItemRepository.findByProductId(item.getProductId())
                            .orElse(null);
                    String productName = (product != null) ? product.getName() : "Unknown Product";
                    return new OrderItemResponse(
                            item.getId(),
                            item.getOrderId(),
                            item.getProductId(),
                            productName,
                            item.getQuantity(),
                            item.getPriceAtPurchase(),
                            item.getQuantity() * item.getPriceAtPurchase()
                    );
                })
                .toList();
    }

    /**
     * Return a paginated list of all orders across all users.
     * Requirements: Admin panel
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
                                    o.getTotalPrice(), o.getShippingAddress(),
                                    o.getStatus(), o.getCreatedAt());
                        })
                        .toList();

        return new PageResponse<>(content, page, size, total, totalPages);
    }

    /**
     * Update the status of an order (admin only).
     * Validates status value; throws InvalidStatusException (400) if invalid.
     * Valid statuses: Pending, Dispatched, Delivered, Cancelled
     * Requirements: Admin order management
     */
    public Order updateOrderStatus(Long orderId, String status) {
        if (status == null || !VALID_ORDER_STATUSES.contains(status)) {
            throw new InvalidStatusException(
                    "Invalid order status. Valid values: Pending, Dispatched, Delivered, Cancelled");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // If cancelling, restore stock
        if (status.equals("Cancelled") && !order.getStatus().equals("Cancelled")) {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            for (OrderItem item : items) {
                productService.restoreStock(item.getProductId(), item.getQuantity());
            }
        }

        order.setStatus(status);
        Order saved = orderRepository.save(order);

        // Push real-time update to the order owner
        messagingTemplate.convertAndSendToUser(
                String.valueOf(saved.getUserId()), "/queue/order-update", saved);

        // Notify admin panel with full response including username
        String username = userRepository.findById(saved.getUserId()).map(User::getUsername).orElse("unknown");
        messagingTemplate.convertAndSend("/topic/admin/orders",
                new AdminOrderResponse(saved.getId(), saved.getUserId(), username,
                        saved.getTotalPrice(), saved.getShippingAddress(),
                        saved.getStatus(), saved.getCreatedAt()));
        return saved;
    }

    /**
     * Helper class for order item data
     */
    private static class OrderItemData {
        String productId;
        int quantity;
        double priceAtPurchase;

        OrderItemData(String productId, int quantity, double priceAtPurchase) {
            this.productId = productId;
            this.quantity = quantity;
            this.priceAtPurchase = priceAtPurchase;
        }
    }
}
