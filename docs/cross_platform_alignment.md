# Exhibae Connect - Cross-Platform Alignment Documentation

## Overview
This document outlines the alignment strategy and specifications for the Exhibae Connect platform across web and mobile implementations.

## Table of Contents
1. [Architecture](#architecture)
2. [Data Models](#data-models)
3. [API Integration](#api-integration)
4. [State Management](#state-management)
5. [Feature Matrix](#feature-matrix)
6. [UI/UX Guidelines](#uiux-guidelines)
7. [Authentication](#authentication)
8. [Testing Strategy](#testing-strategy)

## Architecture

### Web Platform
- Framework: React.js
- State Management: Redux/Context
- API Client: Axios
- Routing: React Router

### Mobile Platform
- Framework: Flutter
- State Management: Riverpod
- API Client: Dio
- Routing: Flutter Navigation 2.0

## Data Models

### Common Models

#### Product
```dart
// Mobile Implementation
class Product {
    String id;
    String name;
    String description;
    double price;
    int stock;
    String category;
    List<String> images;
    String brandId;
    DateTime createdAt;
    DateTime updatedAt;
    bool isActive;
}
```

#### Event
```dart
// Mobile Implementation
class Event {
    String id;
    String name;
    String description;
    DateTime startDate;
    DateTime endDate;
    String venueId;
    String organizerId;
    List<String> images;
    int capacity;
    int registeredCount;
    EventStatus status;
    double price;
    bool isPublic;
    DateTime createdAt;
    DateTime updatedAt;
}
```

#### Venue
```dart
// Mobile Implementation
class Venue {
    String id;
    String name;
    String description;
    String address;
    String city;
    String state;
    String country;
    String zipCode;
    double latitude;
    double longitude;
    int capacity;
    List<String> images;
    List<String> amenities;
    String organizerId;
    bool isActive;
    DateTime createdAt;
    DateTime updatedAt;
}
```

#### Order
```dart
// Mobile Implementation
class Order {
    String id;
    String userId;
    String brandId;
    List<OrderItem> items;
    double subtotal;
    double tax;
    double shipping;
    double total;
    OrderStatus status;
    String? shippingAddress;
    String? trackingNumber;
    DateTime createdAt;
    DateTime updatedAt;
}
```

## API Integration

### Base URL
- Development: `https://api-dev.exhibae.com`
- Production: `https://api.exhibae.com`

### Common Endpoints

#### Products
- GET `/products` - List products
- GET `/products/{id}` - Get product details
- POST `/products` - Create product
- PUT `/products/{id}` - Update product
- DELETE `/products/{id}` - Delete product
- POST `/products/upload` - Upload product image

#### Events
- GET `/events` - List events
- GET `/events/{id}` - Get event details
- POST `/events` - Create event
- PUT `/events/{id}` - Update event
- DELETE `/events/{id}` - Delete event
- POST `/events/upload` - Upload event image
- PUT `/events/{id}/status` - Update event status
- POST `/events/{id}/register` - Register for event
- DELETE `/events/{id}/register` - Unregister from event

#### Venues
- GET `/venues` - List venues
- GET `/venues/{id}` - Get venue details
- POST `/venues` - Create venue
- PUT `/venues/{id}` - Update venue
- DELETE `/venues/{id}` - Delete venue
- POST `/venues/upload` - Upload venue image
- GET `/venues/amenities` - Get available amenities

#### Orders
- GET `/orders` - List orders
- GET `/orders/{id}` - Get order details
- POST `/orders` - Create order
- PUT `/orders/{id}` - Update order
- DELETE `/orders/{id}` - Delete order
- PUT `/orders/{id}/status` - Update order status
- PUT `/orders/{id}/tracking` - Update tracking number

## State Management

### Web Platform (Redux/Context)
- Global state for authentication
- Entity-specific stores for products, events, venues, orders
- Loading and error states
- Pagination state
- Filter and sort state

### Mobile Platform (Riverpod)
```dart
// Authentication
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>

// Products
final productsProvider = StateNotifierProvider<ProductsNotifier, AsyncValue<List<Product>>>

// Events
final eventsProvider = StateNotifierProvider<EventsNotifier, AsyncValue<List<Event>>>

// Venues
final venuesProvider = StateNotifierProvider<VenuesNotifier, AsyncValue<List<Venue>>>

// Orders
final ordersProvider = StateNotifierProvider<OrdersNotifier, AsyncValue<List<Order>>>
```

## Feature Matrix

| Feature                    | Web | Mobile | Notes                           |
|---------------------------|-----|--------|----------------------------------|
| User Authentication       | ✓   | ✓      | JWT-based authentication        |
| Product Management        | ✓   | ✓      | CRUD operations                 |
| Event Management         | ✓   | ✓      | Including registration system   |
| Venue Management         | ✓   | ✓      | With location services         |
| Order Processing         | ✓   | ✓      | Full order lifecycle           |
| Image Upload             | ✓   | ✓      | Multi-image support            |
| Real-time Updates        | ✓   | 🚧     | WebSocket implementation       |
| Offline Support          | ❌   | 🚧     | Mobile-specific requirement    |
| Push Notifications       | ❌   | 🚧     | Mobile-specific requirement    |
| Analytics Dashboard      | ✓   | ✓      | Platform-specific views        |

## UI/UX Guidelines

### Common Elements
- Color Scheme
  - Primary: `#4A90E2`
  - Secondary: `#F5A623`
  - Error: `#D0021B`
  - Success: `#7ED321`
  - Background: `#F8F9FA`

- Typography
  - Web: Inter, system-ui
  - Mobile: Default platform fonts

### Platform-Specific Patterns
- Web:
  - Sidebar navigation
  - Data tables for lists
  - Modal dialogs for forms

- Mobile:
  - Bottom navigation
  - Card-based lists
  - Full-screen forms
  - Pull-to-refresh

## Authentication

### Flow
1. Login/Register with email and password
2. Receive JWT token
3. Store token securely
   - Web: LocalStorage/HttpOnly Cookie
   - Mobile: Secure Storage
4. Include token in API requests
5. Handle token refresh
6. Manage logout and token cleanup

### Security Measures
- HTTPS for all API calls
- Token expiration
- Refresh token rotation
- Secure storage of credentials
- Rate limiting
- Input validation

## Testing Strategy

### Unit Tests
- Models serialization/deserialization
- Business logic
- State management
- Utility functions

### Integration Tests
- API integration
- State management integration
- Navigation flows
- Form submissions

### E2E Tests
- Critical user journeys
- Cross-platform workflows
- Payment flows
- Registration/Authentication

### Platform-Specific Tests
- Web:
  - Browser compatibility
  - Responsive design
  - SEO requirements

- Mobile:
  - Device compatibility
  - Offline behavior
  - Push notifications
  - Deep linking

## Version Control

### Branch Strategy
- `main` - Production code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `release/*` - Release branches

### Shared Components
- API types/interfaces
- Validation rules
- Business logic
- Configuration

## Deployment

### Web Platform
- Build process
- Environment configuration
- CDN setup
- Analytics integration

### Mobile Platform
- Build variants
- Environment configuration
- Store deployment
- Analytics integration

## Monitoring and Analytics

### Common Metrics
- User engagement
- Error rates
- API performance
- Business metrics

### Platform-Specific Metrics
- Web:
  - Page load times
  - SEO metrics
  - Browser usage

- Mobile:
  - App launch time
  - Platform distribution
  - Crash reports 