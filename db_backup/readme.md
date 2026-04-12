# Greenfield Academy - Fake Database Setup Instructions

## Prerequisites
- A fresh Supabase project
- The three SQL files: `tables.sql`, `constraints.sql`, `policies.sql`

---

## Step 1 - Run `tables.sql`
1. Open the SQL editor in your new Supabase project
2. Copy and paste the entire contents of `tables.sql`
3. Click **Run**

This creates all tables and inserts all data.

---

## Step 2 - Create Superadmin Auth User
1. Go to **Authentication -> Users -> Add User**
2. Enter the superadmin email and password
3. Copy the **UUID** that Supabase generates for the user

---

## Step 3 - Insert Superadmin Record
Run this in the SQL editor with the UUID and email from Step 2:

```sql
INSERT INTO public.superadmin (id, email) 
VALUES ('your-uuid-here', 'your@email.com');
```

---

## Step 4 - Run `constraints.sql`
1. Copy and paste the entire contents of `constraints.sql`
2. Click **Run**

This adds all foreign keys and constraints.

---

## Step 5 - Run `policies.sql`
1. Copy and paste the entire contents of `policies.sql`
2. Click **Run**

This enables RLS and sets all read/write policies.

---

## Step 6 - Verify
Spot check a few tables in the **Table Editor** to confirm data is present:
- `students` - should have all student records
- `results` - should have all result records  
- `teachers` - should have all teacher records

Then test the app by logging in as superadmin.

---

## Notes
- Steps must be followed **in order** - constraints will fail if run before data is inserted
- The superadmin Auth user **must** be created via the dashboard 
- it cannot be done in SQL
- RLS policies allow **public read** and **authenticated write** on all tables