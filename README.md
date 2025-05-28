# Exhibae Connect

A modern web application for managing exhibitions and connecting brands with organizers.

## Features
- Brand Management
  - Brand profile creation and management
  - Brand portfolio pages with company information
  - Brand discovery with search and filtering
  - Brand gallery for showcasing products
  - Look books for brand catalogs
  - Brand statistics and analytics
  - Activity logging for brand actions
  - Materials management
- Exhibition Organization
  - Exhibition creation and editing
  - Exhibition details page with comprehensive information
  - Exhibition discovery with search and filtering
  - Exhibition gallery for venue visualization
  - Exhibition categorization and venue types
  - Date and time management for exhibitions
- Stall Management
  - Advanced stall booking workflow
  - Multiple stall statuses (available, pending, payment_pending, booked, under_maintenance)
  - Stall configuration with customizable dimensions
  - Stall pricing and quantity management
  - Stall layout designer with positioning
  - Stall maintenance tracking
  - Booking deadline management
- Application System
  - Comprehensive application workflow
  - Status tracking (pending, payment_pending, payment_review, booked, rejected)
  - Automated status updates
  - Payment integration
  - Email notifications for status changes
  - Application approval workflow
- User Dashboard with:
  - Profile Management (personal info, contact details, bio)
  - Notification Preferences (email and push notifications)
  - Favorites System (brands and exhibitions)
  - Exhibition Attendance Tracking
  - Real-time application updates
  - Statistics and analytics
- Communication Tools
  - Direct messaging between brands and organizers
  - Email notification system
  - Real-time updates and notifications
  - Conversation tracking
- Payment System
  - Secure payment processing
  - Payment status tracking
  - Transaction history
  - Partial payment support
- Security Features
  - Secure Authentication with Row Level Security (RLS)
  - Role-based access control
  - Data privacy policies
  - Secure payment handling
- Modern UI/UX
  - Clean and intuitive navigation
  - Optimized hero sections
  - Interactive exhibition cards
  - Dynamic sliders and galleries
  - Toast notifications
  - Loading states and error handling
  - Form validation

## Database Features
- Brand Statistics
  - Total applications tracking
  - Approved/rejected applications count
  - Active stalls monitoring
  - Total exhibitions participated
  - Revenue tracking
- Activity Logging
  - Application submissions
  - Status changes
  - Exhibition participation
  - Payment transactions
- Advanced Relationships
  - Brand-Exhibition connections
  - Stall-Application mapping
  - User-Role associations
- Performance Optimized
  - Indexed queries
  - Efficient data structures
  - Real-time capabilities

## Deployment
The application is automatically deployed via GitHub Actions when changes are pushed to the master branch.

## Development
To run the application locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# To run with email service
npm run email-server

# To run everything (frontend + backend + email)
npm run start:all
```

## Production Build
```bash
npm run build
```

### Build Optimization
The production build includes several optimizations:
- TypeScript compilation
- Asset minification
- CSS optimization
- Bundle splitting
- Dynamic imports for code splitting
- Chunk size optimization
- Tree shaking

For better performance, consider:
- Using dynamic imports for code splitting
- Configuring manual chunks in `vite.config.ts`
- Adjusting chunk size warnings in build configuration

## Tech Stack
- React
- Vite
- TypeScript
- Supabase
  - Authentication
  - Real-time Database
  - Row Level Security (RLS)
  - Stored Procedures
  - Database Triggers
- Tailwind CSS
- React Query (Tanstack Query)
- React Hook Form
- Zod Validation
- Lucide Icons
- Shadcn/ui Components
- Node.js Email Service
- Swiper for Sliders

## Project info

**URL**: https://lovable.dev/projects/2d68534a-e1c6-439b-af4f-8951f5064751

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2d68534a-e1c6-439b-af4f-8951f5064751) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev

# Optional: Start email service for full functionality
npm run email-server
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
