# Manual Supabase Setup Instructions

After running the `supabase_setup_no_drops.sql` script, you need to manually create some triggers and storage policies in the Supabase dashboard. Here are the detailed step-by-step instructions:

## 1. Create Database Triggers

### Step 1: Navigate to Database Triggers
1. Open your Supabase project dashboard
2. Go to **Database** > **Triggers** in the left sidebar

### Step 2: Create Companies Table Trigger
1. Click **Create a new trigger**
2. Fill in the details:
   - **Name**: `update_companies_updated_at`
   - **Table**: `companies`
   - **Events**: Select **update** (uncheck insert and delete)
   - **Type**: Select **before**
   - **Function**: Select `update_updated_at_column` from dropdown
3. Click **Create trigger**

### Step 3: Create Subscriptions Table Trigger
1. Click **Create a new trigger** again
2. Fill in the details:
   - **Name**: `update_subscriptions_updated_at`
   - **Table**: `subscriptions`
   - **Events**: Select **update** (uncheck insert and delete)
   - **Type**: Select **before**
   - **Function**: Select `update_updated_at_column` from dropdown
3. Click **Create trigger**

## 2. Create Storage Policies

### Step 1: Navigate to Storage Policies
1. In your Supabase dashboard, go to **Storage** in the left sidebar
2. Click on the **company-documents** bucket
3. Click on the **Policies** tab

### Step 2: Create INSERT Policy for Certificate Upload
1. Click **New policy**
2. Choose **Create a policy from scratch**
3. Fill in the details:
   - **Policy name**: `Companies can upload certificates`
   - **Allowed operation**: **INSERT**
   - **Target roles**: `authenticated`
   - **USING expression**: Leave empty (will be filled automatically)
   - **WITH CHECK expression**:
     ```sql
     auth.uid()::text = (storage.foldername(name))[1]
     ```
4. Click **Save policy**

### Step 3: Create SELECT Policy for Certificate Viewing
1. Click **New policy**
2. Choose **Create a policy from scratch**
3. Fill in the details:
   - **Policy name**: `Companies can view certificates`
   - **Allowed operation**: **SELECT**
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     auth.uid()::text = (storage.foldername(name))[1]
     ```
4. Click **Save policy**

### Step 4: Create UPDATE Policy for Certificate Updates
1. Click **New policy**
2. Choose **Create a policy from scratch**
3. Fill in the details:
   - **Policy name**: `Companies can update certificates`
   - **Allowed operation**: **UPDATE**
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     auth.uid()::text = (storage.foldername(name))[1]
     ```
   - **WITH CHECK expression**:
     ```sql
     auth.uid()::text = (storage.foldername(name))[1]
     ```
4. Click **Save policy**

### Step 5: Create DELETE Policy for Certificate Deletion
1. Click **New policy**
2. Choose **Create a policy from scratch**
3. Fill in the details:
   - **Policy name**: `Companies can delete certificates`
   - **Allowed operation**: **DELETE**
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     auth.uid()::text = (storage.foldername(name))[1]
     ```
4. Click **Save policy**

## 3. Verify Setup

### Check Tables
Go to **Database** > **Tables** and verify you see:
- `companies` table with all columns
- `subscriptions` table with all columns
- `jobs` table with new columns: `company_id`, `is_foreign`, `email`, `phone`, `whatsapp`, `application_link`

### Check Triggers
Go to **Database** > **Triggers** and verify you see:
- `update_companies_updated_at` trigger on companies table
- `update_subscriptions_updated_at` trigger on subscriptions table

### Check Storage
Go to **Storage** and verify:
- `company-documents` bucket exists
- The bucket has 4 policies created

### Check Views
Go to **Database** > **Views** and verify:
- `admin_company_verification` view exists

## 4. Test the Setup

### Test Company Registration
You can test if everything is working by making a POST request to your backend:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company Ltd",
    "email": "test@company.com",
    "phone": "+256701234567",
    "country": "Uganda",
    "password": "password123"
  }'
```

### Test Database Connection
Check if your backend can connect to the database by visiting:
```
http://localhost:3000/health
```

## 5. Troubleshooting

### If Triggers Don't Work
- Make sure the `update_updated_at_column` function exists in your database
- Check that the trigger is set to **before** not **after**
- Verify the function is selected correctly in the trigger configuration

### If Storage Policies Don't Work
- Make sure you're using the exact SQL expressions provided above
- Verify that the `company-documents` bucket is public
- Check that all 4 policies (INSERT, SELECT, UPDATE, DELETE) are created

### If Tables Are Missing Columns
- Re-run the SQL script from `supabase_setup_no_drops.sql`
- Check the Database > Logs for any error messages

## 6. Next Steps

Once everything is set up:
1. Test the complete company registration and authentication flow
2. Test certificate upload functionality
3. Test job creation and management
4. Set up the Angular frontend for the company portal
5. Integrate Pesapal payments for subscriptions

If you encounter any issues, check the backend server logs and Supabase database logs for error messages.
