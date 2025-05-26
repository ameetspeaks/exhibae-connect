# Exhibae Connect

A modern web application for managing exhibitions and connecting brands with organizers.

## Features
- Brand Management
- Exhibition Organization
- User Dashboard with:
  - Profile Management (personal info, contact details, bio)
  - Notification Preferences (email and push notifications)
  - Favorites System (brands and exhibitions)
  - Exhibition Attendance Tracking
- Secure Authentication with Row Level Security (RLS)
- Real-time Updates
- Responsive Design

## Database Features
- Brand Favorites
- Exhibition Favorites
- Exhibition Attendance Tracking
- Profile Management
- Notification Preferences

## Deployment
The application is automatically deployed via GitHub Actions when changes are pushed to the master branch.

## Development
To run the application locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Build
```bash
npm run build
```

## Tech Stack
- React
- Vite
- TypeScript
- Supabase
  - Authentication
  - Real-time Database
  - Row Level Security (RLS)
- Tailwind CSS
- React Query (Tanstack Query)
- React Hook Form
- Zod Validation
- Lucide Icons
- Shadcn/ui Components

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
