// Subset of the Strava API v3 models we actually use.
// Ref: https://developers.strava.com/docs/reference/

export interface StravaGear {
  id: string;
  name: string;
  distance: number; // lifetime meters
  primary?: boolean;
}

export interface StravaAthlete {
  id: number;
  username?: string | null;
  firstname: string;
  lastname: string;
  profile?: string; // avatar URL (large)
  profile_medium?: string;
  city?: string | null;
  country?: string | null;
  weight?: number | null; // kg
  // Only present with the profile:read_all scope
  bikes?: StravaGear[];
  shoes?: StravaGear[];
}

export interface StravaSummaryActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string;
  sport_type: string;
  start_date: string; // ISO UTC
  start_date_local: string; // ISO, local wall-clock time but suffixed with "Z"
  timezone?: string;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  total_photo_count?: number;
  pr_count?: number;
  trainer: boolean;
  commute: boolean;
  manual?: boolean;
  private?: boolean;
  gear_id?: string | null;
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  has_heartrate?: boolean;
  kilojoules?: number;
  suffer_score?: number | null; // undocumented but usually present
  location_country?: string | null;
}

export interface StravaTokenResponse {
  token_type: "Bearer";
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  expires_in: number;
  athlete?: StravaAthlete;
}
