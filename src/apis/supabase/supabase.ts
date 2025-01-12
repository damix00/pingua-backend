import config from "../../utils/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    config.get("SUPABASE_URL"),
    config.get("SUPABASE_API_KEY")
);

export default supabase;
