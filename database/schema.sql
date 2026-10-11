-- ==============================================================================
-- FinTrack Database Schema (PostgreSQL for Supabase)
-- "Personal Finance, Simplified."
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Extends the Supabase auth.users table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    monthly_income NUMERIC(12, 2) DEFAULT 0,
    average_monthly_spending NUMERIC(12, 2) DEFAULT 0,
    average_monthly_savings NUMERIC(12, 2) DEFAULT 0,
    preferred_payment_method TEXT DEFAULT 'UPI',
    currency TEXT DEFAULT 'INR',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Safe migration statements if running on an existing Supabase instance:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(12, 2) DEFAULT 0;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_monthly_spending NUMERIC(12, 2) DEFAULT 0;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_monthly_savings NUMERIC(12, 2) DEFAULT 0;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT DEFAULT 'UPI';
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- ------------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- Stores user-defined income/expense categories (strictly isolated per user)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#C9B58A',
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_category_name_type UNIQUE (user_id, name, type)
);

-- ------------------------------------------------------------------------------
-- 3. TRANSACTIONS TABLE
-- Stores user financial ledger records (income and expenses)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'UPI',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. BUDGETS TABLE
-- Stores monthly spending limits per category
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2020 AND year <= 2100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year)
);

-- ------------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- Optimized for high-throughput user data queries and analytics aggregation
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(user_id, type);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(user_id, type);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year ON public.budgets(user_id, year, month);

-- ------------------------------------------------------------------------------
-- AUTOMATIC UPDATED_AT TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_transactions_updated_at ON public.transactions;
CREATE TRIGGER set_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_budgets_updated_at ON public.budgets;
CREATE TRIGGER set_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- SAFE NEW USER TRIGGER
-- Automatically creates a basic profile record upon auth.users signup.
-- Never creates dummy financial transactions, fake income, expenses or budgets.
-- Wrapped in an exception block so signup is never blocked.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Create initial clean profile
    INSERT INTO public.profiles (
        id,
        full_name,
        currency,
        onboarding_completed,
        monthly_income,
        average_monthly_spending,
        average_monthly_savings,
        preferred_payment_method
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'INR',
        FALSE,
        0,
        0,
        0,
        'UPI'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Safely create starter categories for this specific user
    BEGIN
        INSERT INTO public.categories (user_id, name, type, icon, color, is_default)
        VALUES
            (NEW.id, 'Food & Dining', 'expense', 'Utensils', '#E98282', TRUE),
            (NEW.id, 'Shopping', 'expense', 'ShoppingBag', '#D4A373', TRUE),
            (NEW.id, 'Transport', 'expense', 'Car', '#90A4AE', TRUE),
            (NEW.id, 'Bills & Utilities', 'expense', 'FileText', '#E57373', TRUE),
            (NEW.id, 'Entertainment', 'expense', 'Film', '#BA68C8', TRUE),
            (NEW.id, 'Health & Medical', 'expense', 'Activity', '#4DB6AC', TRUE),
            (NEW.id, 'Salary', 'income', 'Briefcase', '#7ED6A5', TRUE),
            (NEW.id, 'Freelance', 'income', 'Laptop', '#81C784', TRUE),
            (NEW.id, 'Investments', 'income', 'DollarSign', '#C9B58A', TRUE),
            (NEW.id, 'Other Income', 'income', 'PlusCircle', '#8E929B', TRUE)
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Ensure trigger never fails user creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

