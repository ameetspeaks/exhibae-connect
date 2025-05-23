-- Disable triggers temporarily
SET session_replication_role = replica;

-- Create or replace function to handle profile updates to include combined counts
CREATE OR REPLACE FUNCTION get_organiser_stats(organiser_id UUID)
RETURNS RECORD
LANGUAGE plpgsql
AS $$
DECLARE
    result RECORD;
BEGIN
    -- Get follower count and attendees hosted (from both interests and favorites)
    SELECT
        COALESCE(count(DISTINCT ei.brand_id), 0) AS followers_count,
        COALESCE(
            (
                SELECT count(DISTINCT ei.brand_id) 
                FROM exhibition_interests ei
                JOIN exhibitions e ON e.id = ei.exhibition_id
                WHERE e.organiser_id = organiser_id
            ), 0
        ) AS attendees_hosted
    INTO result
    FROM
        profiles p
    LEFT JOIN
        exhibitions e ON p.id = e.organiser_id
    LEFT JOIN
        exhibition_interests ei ON e.id = ei.exhibition_id
    WHERE
        p.id = organiser_id
    GROUP BY
        p.id;
    
    RETURN result;
END;
$$;

-- Function to update organiser statistics
CREATE OR REPLACE FUNCTION update_organiser_statistics(organiser_id_param uuid)
RETURNS void AS $$
DECLARE
    stats RECORD;
BEGIN
    -- Get the stats
    SELECT * FROM get_organiser_stats(organiser_id_param) INTO stats;
    
    -- Update the organiser profile
    UPDATE profiles
    SET 
        attendees_hosted = stats.attendees_hosted
    WHERE
        id = organiser_id_param
        AND role = 'organiser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for interests
CREATE OR REPLACE FUNCTION update_organiser_stats_on_interest_change()
RETURNS TRIGGER AS $$
DECLARE
    organiser_id uuid;
BEGIN
    -- Get the organiser id for this exhibition
    SELECT e.organiser_id INTO organiser_id
    FROM exhibitions e
    WHERE e.id = COALESCE(NEW.exhibition_id, OLD.exhibition_id);
    
    -- Update the stats
    IF organiser_id IS NOT NULL THEN
        PERFORM update_organiser_statistics(organiser_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for exhibition_interests
DROP TRIGGER IF EXISTS update_organiser_stats_interest_trigger ON exhibition_interests;
CREATE TRIGGER update_organiser_stats_interest_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON exhibition_interests
    FOR EACH ROW
    EXECUTE FUNCTION update_organiser_stats_on_interest_change();

-- Enable triggers again
SET session_replication_role = DEFAULT; 