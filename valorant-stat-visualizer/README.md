# Valorant Match Tracker

A web application that allows users to import Valorant match data from tracker.gg URLs, store player statistics, manage teams, and visualize performance data over time.

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Scraping**: Cheerio
- **Charts**: Recharts

## Setup Instructions

### 1. Database Setup

1. **Create Supabase Project:**
   - Go to https://supabase.com and sign up/log in
   - Click "New Project"
   - Project name: `valorant-tracker`
   - Set a strong database password (save in password manager)
   - Wait for project initialization (~2 minutes)

2. **Execute Database Schema:**
   - Navigate to SQL Editor in Supabase dashboard
   - Copy and paste the contents of `database/schema.sql`
   - Click "Run" to execute

3. **Configure Environment Variables:**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

### 2. Development Setup

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 3. Database Connection Test

The home page includes a database connection test component. Once you've set up your Supabase credentials, you should see a success message indicating the connection works.

## Project Structure

```
valorant-stat-visualizer/
├── app/                    # Next.js app directory
├── components/             # React components
├── database/               # Database schema and setup docs
├── lib/                    # Utility libraries (Supabase client)
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## Database Schema

The application uses 5 main tables:

- **players**: Unique player information
- **teams**: Team information
- **team_members**: Many-to-many relationship between teams and players
- **matches**: Match metadata (URL, date, map)
- **match_stats**: Individual player performance per match

See `database/README.md` for detailed schema information.

## Next Steps

After completing the database setup:

1. **Task 3**: Configure Supabase client (✅ Complete)
2. **Task 4**: Build match import API route & frontend component
3. **Task 5**: Implement tracker.gg HTML parser
4. **Task 6+**: Save data to database, build UI components, add visualizations

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
