# Exhibae Connect - Documentation

## Overview

Exhibae Connect is a comprehensive platform designed to connect exhibition organizers with brands looking to showcase their products. The platform facilitates the entire exhibition management process, from planning and organizing exhibitions to brand discovery and stall booking.

## Core Features

### 1. User Management

#### User Roles
- **Brands**: Companies looking to participate in exhibitions
- **Organizers**: Entities that create and manage exhibitions
- **Shoppers**: End users interested in attending exhibitions
- **Managers**: Administrative users with elevated permissions

#### Authentication
- Secure user authentication powered by Supabase
- Role-based access control
- Profile management for all user types

### 2. Brand Management

#### Brand Profiles
- Comprehensive brand portfolios with company information
- Customizable brand logos and descriptions
- Contact information and website links
- Gallery for showcasing brand images and products

#### Brand Discovery
- Searchable brand directory with filtering capabilities
- Sorting by company name and creation date
- Pagination for easy navigation
- Visual card-based interface for brand browsing

#### Brand Portfolio
- Dedicated brand portfolio pages
- Exhibition history and participation records
- Look books and product galleries
- Contact information for potential collaborations

### 3. Exhibition Management

#### Exhibition Creation and Editing
- Detailed exhibition information (title, description, dates, location)
- Exhibition categorization
- Venue type selection
- Start and end date/time configuration

#### Exhibition Discovery
- Searchable exhibition directory
- Filtering by date, location, and category
- Featured exhibitions highlighting
- Visual gallery of upcoming events

#### Exhibition Details
- Comprehensive exhibition information display
- Image galleries for venue visualization
- Attendance tracking and RSVP functionality
- Exhibition sharing capabilities

### 4. Stall Management

#### Stall Configuration
- Customizable stall dimensions and pricing
- Multiple stall types per exhibition
- Amenity selection for stalls
- Quantity management for available stalls

#### Stall Layout
- Visual stall layout designer
- Drag-and-drop stall positioning
- Rotation and arrangement capabilities
- Layout preview for exhibitors and brands

#### Stall Booking
- Application system for brands to request stalls
- Approval workflow for organizers
- Payment processing for confirmed bookings
- Special requirements handling

### 5. Communication Tools

#### Notifications
- Real-time notification system
- Email notifications for important events
- Application status updates
- Exhibition reminders

#### Messaging
- Direct messaging between brands and organizers
- Inquiry system for exhibition details
- Application-specific communication
- File and image sharing capabilities

### 6. Analytics and Reporting

#### Exhibition Analytics
- Attendance tracking and reporting
- Brand participation metrics
- Stall booking statistics
- Financial reporting for organizers

#### Brand Analytics
- Exhibition participation history
- Application success rates
- Engagement metrics
- Portfolio performance statistics

## Technical Implementation

### Frontend
- React with TypeScript for type safety
- Vite for fast development and building
- Tailwind CSS for responsive design
- Shadcn UI components for consistent styling
- React Router for navigation
- React Query for data fetching and caching

### Backend
- Supabase for database and authentication
- RESTful API endpoints for data operations
- Real-time subscriptions for live updates
- Secure file storage for images and documents

### Deployment
- Automated deployment via GitHub Actions
- Production builds with optimized assets
- Environment-specific configurations
- Apache server hosting with proper URL rewriting

## Data Models

### Core Entities
- Users/Profiles (brands, organizers, shoppers)
- Exhibitions (events organized by organizers)
- Stalls (spaces within exhibitions)
- Stall Instances (specific stall placements)
- Applications (requests from brands to book stalls)
- Gallery Images (visual content for exhibitions and brands)
- Look Books (brand product catalogs)

## User Flows

### Brand User Flow
1. Register/Login as a Brand
2. Complete brand profile with company details
3. Browse available exhibitions
4. View exhibition details and available stalls
5. Apply for stalls at desired exhibitions
6. Manage applications and confirmed bookings
7. Showcase products through gallery and look books

### Organizer User Flow
1. Register/Login as an Organizer
2. Create new exhibitions with detailed information
3. Configure stalls and layout for exhibitions
4. Review and manage brand applications
5. Communicate with participating brands
6. Track exhibition attendance and performance
7. Manage exhibition details and updates

### Shopper User Flow
1. Register/Login as a Shopper
2. Browse upcoming exhibitions
3. View exhibition details and participating brands
4. RSVP to attend exhibitions
5. Explore brand portfolios and products
6. Save favorite exhibitions and brands
7. Receive notifications about upcoming events

## Conclusion

Exhibae Connect provides a comprehensive solution for exhibition management, brand discovery, and stall booking. The platform streamlines the entire process from exhibition creation to brand participation, enhancing the experience for organizers, brands, and shoppers alike. 