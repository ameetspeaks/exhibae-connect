-- Add application_deadline to exhibitions if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exhibitions' 
        AND column_name = 'application_deadline'
    ) THEN
        ALTER TABLE exhibitions 
        ADD COLUMN application_deadline TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES stall_applications(id),
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing brand_activity_log table if exists
DROP TABLE IF EXISTS brand_activity_log CASCADE;

-- Create brand_activity_log table with explicit foreign key names
CREATE TABLE brand_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    stall_application_id UUID,  -- renamed from reference_id for clarity
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_brand_activity_log_brand
        FOREIGN KEY (brand_id) 
        REFERENCES profiles(id),
    CONSTRAINT fk_brand_activity_log_application
        FOREIGN KEY (stall_application_id) 
        REFERENCES stall_applications(id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_brand_activity_log_brand_id ON brand_activity_log(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_activity_log_application_id ON brand_activity_log(stall_application_id);

-- Create brand_statistics table
CREATE TABLE IF NOT EXISTS brand_statistics (
    brand_id UUID PRIMARY KEY REFERENCES profiles(id),
    total_applications INTEGER DEFAULT 0,
    approved_applications INTEGER DEFAULT 0,
    rejected_applications INTEGER DEFAULT 0,
    active_stalls INTEGER DEFAULT 0,
    total_exhibitions_participated INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing policies for brand_activity_log
DROP POLICY IF EXISTS "Brands can view their own activity" ON brand_activity_log;
DROP POLICY IF EXISTS "Organisers can view all activity" ON brand_activity_log;

-- Create RLS policies for brand_activity_log
ALTER TABLE brand_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own activity"
    ON brand_activity_log FOR SELECT
    USING (brand_id = auth.uid());

CREATE POLICY "Organisers can view all activity"
    ON brand_activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'organiser'
        )
    );

-- Drop existing policies for payment_transactions
DROP POLICY IF EXISTS "Brands can view their own payments" ON payment_transactions;
DROP POLICY IF EXISTS "Organisers can view all payments" ON payment_transactions;

-- Create RLS policies for payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own payments"
    ON payment_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM stall_applications sa
            WHERE sa.id = payment_transactions.application_id
            AND sa.brand_id = auth.uid()
        )
    );

CREATE POLICY "Organisers can view all payments"
    ON payment_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'organiser'
        )
    );

-- Drop existing policies for brand_statistics
DROP POLICY IF EXISTS "Brands can view their own statistics" ON brand_statistics;
DROP POLICY IF EXISTS "Organisers can view all statistics" ON brand_statistics;

-- Create RLS policies for brand_statistics
ALTER TABLE brand_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own statistics"
    ON brand_statistics FOR SELECT
    USING (brand_id = auth.uid());

CREATE POLICY "Organisers can view all statistics"
    ON brand_statistics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'organiser'
        )
    );

-- Function to log brand activity
CREATE OR REPLACE FUNCTION log_brand_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO brand_activity_log (
        brand_id,
        activity_type,
        stall_application_id,  -- updated field name
        details
    ) VALUES (
        NEW.brand_id,
        CASE
            WHEN TG_OP = 'INSERT' THEN 'application_submitted'
            WHEN TG_OP = 'UPDATE' AND NEW.status = 'approved' THEN 'application_approved'
            WHEN TG_OP = 'UPDATE' AND NEW.status = 'rejected' THEN 'application_rejected'
            WHEN TG_OP = 'UPDATE' AND NEW.status = 'confirmed' THEN 'application_confirmed'
            ELSE 'status_updated'
        END,
        NEW.id,
        jsonb_build_object(
            'status', NEW.status,
            'exhibition_id', NEW.exhibition_id,
            'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for logging brand activity
DROP TRIGGER IF EXISTS log_brand_activity_trigger ON stall_applications;

CREATE TRIGGER log_brand_activity_trigger
    AFTER INSERT OR UPDATE OF status
    ON stall_applications
    FOR EACH ROW
    EXECUTE FUNCTION log_brand_activity();

-- Function to calculate brand statistics
CREATE OR REPLACE FUNCTION calculate_brand_statistics(brand_id_param uuid)
RETURNS void AS $$
DECLARE
    v_total_apps integer;
    v_approved_apps integer;
    v_rejected_apps integer;
    v_active_stalls integer;
    v_total_exhibitions integer;
BEGIN
    -- Calculate statistics
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status IN ('approved', 'confirmed')) as approved,
            COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
            COUNT(*) FILTER (WHERE 
                status IN ('approved', 'confirmed') 
                AND EXISTS (
                    SELECT 1 
                    FROM exhibitions e 
                    WHERE e.id = stall_applications.exhibition_id 
                    AND e.end_date >= NOW()
                    AND e.status = 'active'
                    AND NOT exhibition_expiry
                )
            ) as active
        FROM stall_applications
        WHERE brand_id = brand_id_param
    )
    SELECT 
        total,
        approved,
        rejected,
        active
    INTO 
        v_total_apps,
        v_approved_apps,
        v_rejected_apps,
        v_active_stalls
    FROM stats;

    -- Calculate total exhibitions participated
    SELECT COUNT(DISTINCT exhibition_id)
    INTO v_total_exhibitions
    FROM stall_applications sa
    JOIN exhibitions e ON e.id = sa.exhibition_id
    WHERE sa.brand_id = brand_id_param
    AND sa.status IN ('approved', 'confirmed');

    -- Insert or update statistics
    INSERT INTO brand_statistics (
        brand_id,
        total_applications,
        approved_applications,
        rejected_applications,
        active_stalls,
        total_exhibitions_participated,
        last_updated
    ) VALUES (
        brand_id_param,
        v_total_apps,
        v_approved_apps,
        v_rejected_apps,
        v_active_stalls,
        v_total_exhibitions,
        NOW()
    )
    ON CONFLICT (brand_id) DO UPDATE SET
        total_applications = EXCLUDED.total_applications,
        approved_applications = EXCLUDED.approved_applications,
        rejected_applications = EXCLUDED.rejected_applications,
        active_stalls = EXCLUDED.active_stalls,
        total_exhibitions_participated = EXCLUDED.total_exhibitions_participated,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to update statistics
CREATE OR REPLACE FUNCTION update_brand_statistics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'stall_applications' THEN
        PERFORM calculate_brand_statistics(NEW.brand_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS update_brand_stats_on_application ON stall_applications;

CREATE TRIGGER update_brand_stats_on_application
    AFTER INSERT OR UPDATE OF status, exhibition_expiry
    ON stall_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_statistics();

-- Function to initialize all brand statistics
CREATE OR REPLACE FUNCTION initialize_all_brand_statistics()
RETURNS void AS $$
DECLARE
    brand record;
BEGIN
    FOR brand IN SELECT id FROM profiles WHERE role = 'brand'
    LOOP
        PERFORM calculate_brand_statistics(brand.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize statistics for all brands
SELECT initialize_all_brand_statistics();

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stall_application_id UUID REFERENCES stall_applications(id),
    brand_id UUID REFERENCES profiles(id),
    exhibition_id UUID REFERENCES exhibitions(id),
    stall_id UUID REFERENCES stalls(id),
    stall_instance_id UUID,
    booking_status TEXT NOT NULL CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    booking_amount DECIMAL(10,2),
    booking_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a view for approved stalls
CREATE OR REPLACE VIEW approved_stalls AS
SELECT 
    sa.id as application_id,
    sa.stall_id,
    sa.brand_id,
    sa.exhibition_id,
    sa.status,
    sa.stall_instance_id,
    sa.booking_deadline,
    sa.booking_confirmed,
    sa.created_at,
    sa.updated_at,
    e.title as exhibition_title,
    e.start_date as exhibition_start_date,
    e.end_date as exhibition_end_date,
    e.address as exhibition_address,
    s.name as stall_name,
    COALESCE(s.description, '') as stall_description,
    s.price as stall_price
FROM stall_applications sa
JOIN exhibitions e ON e.id = sa.exhibition_id
JOIN stalls s ON s.id = sa.stall_id
WHERE sa.status = 'approved'
AND NOT sa.exhibition_expiry;

-- Add RLS policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own bookings"
    ON bookings FOR SELECT
    USING (brand_id = auth.uid());

CREATE POLICY "Organisers can view all bookings"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'organiser'
        )
    );

-- Add RLS policies for approved_stalls view
ALTER TABLE approved_stalls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own approved stalls"
    ON approved_stalls FOR SELECT
    USING (brand_id = auth.uid());

CREATE POLICY "Organisers can view all approved stalls"
    ON approved_stalls FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'organiser'
        )
    );

-- Create stall_bookings table
CREATE TABLE IF NOT EXISTS stall_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES stall_applications(id) NOT NULL,
    brand_id UUID REFERENCES profiles(id) NOT NULL,
    exhibition_id UUID REFERENCES exhibitions(id) NOT NULL,
    stall_id UUID REFERENCES stalls(id) NOT NULL,
    stall_instance_id UUID,
    booking_status TEXT NOT NULL CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    booking_amount DECIMAL(10,2) NOT NULL,
    booking_deadline TIMESTAMP WITH TIME ZONE,
    payment_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stall_booking_payments table
CREATE TABLE IF NOT EXISTS stall_booking_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES stall_bookings(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view for brand stalls overview
CREATE OR REPLACE VIEW brand_stalls_view AS
SELECT 
    sa.id as application_id,
    sa.brand_id,
    sa.exhibition_id,
    sa.stall_id,
    sa.stall_instance_id,
    sa.status as application_status,
    sa.created_at as application_date,
    e.title as exhibition_title,
    e.start_date as exhibition_start_date,
    e.end_date as exhibition_end_date,
    e.address as exhibition_address,
    e.status as exhibition_status,
    s.name as stall_name,
    COALESCE(s.description, '') as stall_description,
    s.price as stall_price,
    s.length as stall_length,
    s.width as stall_width,
    sb.booking_status,
    sb.payment_status,
    sb.booking_deadline,
    sb.payment_deadline,
    sb.booking_amount,
    COALESCE(sbp.total_paid, 0) as total_paid_amount,
    sa.exhibition_expiry
FROM stall_applications sa
JOIN exhibitions e ON e.id = sa.exhibition_id
JOIN stalls s ON s.id = sa.stall_id
LEFT JOIN stall_bookings sb ON sb.application_id = sa.id
LEFT JOIN (
    SELECT 
        booking_id, 
        SUM(amount) FILTER (WHERE status = 'completed') as total_paid
    FROM stall_booking_payments
    GROUP BY booking_id
) sbp ON sbp.booking_id = sb.id
WHERE sa.status = 'approved'
AND (
    -- Show to brand if it's their application
    sa.brand_id = auth.uid()
    OR
    -- Show to organiser if they have the role
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'organiser'
    )
);

-- Add RLS policies for stall_bookings
ALTER TABLE stall_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own bookings"
    ON stall_bookings FOR SELECT
    USING (brand_id = auth.uid());

CREATE POLICY "Brands can insert their own bookings"
    ON stall_bookings FOR INSERT
    WITH CHECK (brand_id = auth.uid());

CREATE POLICY "Brands can update their own bookings"
    ON stall_bookings FOR UPDATE
    USING (brand_id = auth.uid());

CREATE POLICY "Organisers can view all bookings"
    ON stall_bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'organiser'
        )
    );

-- Add RLS policies for stall_booking_payments
ALTER TABLE stall_booking_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own payments"
    ON stall_booking_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM stall_bookings sb
            WHERE sb.id = stall_booking_payments.booking_id
            AND sb.brand_id = auth.uid()
        )
    );

CREATE POLICY "Organisers can view all payments"
    ON stall_booking_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'organiser'
        )
    );

-- Add RLS policies for brand_stalls_view
ALTER VIEW brand_stalls_view ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own stalls"
    ON brand_stalls_view FOR SELECT
    USING (brand_id = auth.uid());

CREATE POLICY "Organisers can view all stalls"
    ON brand_stalls_view FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'organiser'
        )
    );

-- Function to handle booking creation
CREATE OR REPLACE FUNCTION create_stall_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND NOT EXISTS (
        SELECT 1 FROM stall_bookings WHERE application_id = NEW.id
    ) THEN
        INSERT INTO stall_bookings (
            application_id,
            brand_id,
            exhibition_id,
            stall_id,
            stall_instance_id,
            booking_status,
            payment_status,
            booking_amount,
            booking_deadline,
            payment_deadline
        ) VALUES (
            NEW.id,
            NEW.brand_id,
            NEW.exhibition_id,
            NEW.stall_id,
            NEW.stall_instance_id,
            'pending',
            'pending',
            (SELECT price FROM stalls WHERE id = NEW.stall_id),
            NOW() + INTERVAL '48 hours',
            NOW() + INTERVAL '72 hours'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic booking creation
DROP TRIGGER IF EXISTS create_booking_on_approval ON stall_applications;

CREATE TRIGGER create_booking_on_approval
    AFTER INSERT OR UPDATE OF status
    ON stall_applications
    FOR EACH ROW
    EXECUTE FUNCTION create_stall_booking();

-- Add RLS policies for stall_applications
ALTER TABLE stall_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own applications"
    ON stall_applications FOR SELECT
    USING (brand_id = auth.uid());

CREATE POLICY "Organisers can view all applications"
    ON stall_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'organiser'
        )
    );

-- Add RLS policies for exhibitions
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active exhibitions"
    ON exhibitions FOR SELECT
    USING (status = 'active' OR EXISTS (
        SELECT 1 FROM stall_applications sa
        WHERE sa.exhibition_id = exhibitions.id
        AND sa.brand_id = auth.uid()
    ));

-- Add RLS policies for stalls
ALTER TABLE stalls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stalls"
    ON stalls FOR SELECT
    USING (true);

-- Add description to stalls if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stalls' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE stalls 
        ADD COLUMN description TEXT;
    END IF;
END $$; 