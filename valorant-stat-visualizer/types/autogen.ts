export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      match_stats: {
        Row: {
          acs: number | null
          agent: string
          assists: number
          deaths: number
          defuses: number | null
          first_bloods: number | null
          headshot_percent: number | null
          id: string
          kills: number
          match_id: string | null
          plants: number | null
          player_id: string | null
          team_side: string | null
        }
        Insert: {
          acs?: number | null
          agent: string
          assists: number
          deaths: number
          defuses?: number | null
          first_bloods?: number | null
          headshot_percent?: number | null
          id?: string
          kills: number
          match_id?: string | null
          plants?: number | null
          player_id?: string | null
          team_side?: string | null
        }
        Update: {
          acs?: number | null
          agent?: string
          assists?: number
          deaths?: number
          defuses?: number | null
          first_bloods?: number | null
          headshot_percent?: number | null
          id?: string
          kills?: number
          match_id?: string | null
          plants?: number | null
          player_id?: string | null
          team_side?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          id: string
          map: string | null
          match_date: string | null
          scraped_at: string | null
          tracker_url: string
        }
        Insert: {
          id?: string
          map?: string | null
          match_date?: string | null
          scraped_at?: string | null
          tracker_url: string
        }
        Update: {
          id?: string
          map?: string | null
          match_date?: string | null
          scraped_at?: string | null
          tracker_url?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          avg_acs: number | null
          avg_headshot_percent: number | null
          avg_kd_ratio: number | null
          created_at: string | null
          current_rank: string | null
          favorite_agent: string | null
          id: string
          losses: number | null
          name: string
          peak_rank: string | null
          peak_rank_rating: number | null
          rank_rating: number | null
          total_acs: number | null
          total_assists: number | null
          total_deaths: number | null
          total_defuses: number | null
          total_first_bloods: number | null
          total_headshot_percent: number | null
          total_kills: number | null
          total_matches: number | null
          total_plants: number | null
          tracker_id: string | null
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          avg_acs?: number | null
          avg_headshot_percent?: number | null
          avg_kd_ratio?: number | null
          created_at?: string | null
          current_rank?: string | null
          favorite_agent?: string | null
          id?: string
          losses?: number | null
          name: string
          peak_rank?: string | null
          peak_rank_rating?: number | null
          rank_rating?: number | null
          total_acs?: number | null
          total_assists?: number | null
          total_deaths?: number | null
          total_defuses?: number | null
          total_first_bloods?: number | null
          total_headshot_percent?: number | null
          total_kills?: number | null
          total_matches?: number | null
          total_plants?: number | null
          tracker_id?: string | null
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          avg_acs?: number | null
          avg_headshot_percent?: number | null
          avg_kd_ratio?: number | null
          created_at?: string | null
          current_rank?: string | null
          favorite_agent?: string | null
          id?: string
          losses?: number | null
          name?: string
          peak_rank?: string | null
          peak_rank_rating?: number | null
          rank_rating?: number | null
          total_acs?: number | null
          total_assists?: number | null
          total_deaths?: number | null
          total_defuses?: number | null
          total_first_bloods?: number | null
          total_headshot_percent?: number | null
          total_kills?: number | null
          total_matches?: number | null
          total_plants?: number | null
          tracker_id?: string | null
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string | null
          player_id: string | null
          team_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          player_id?: string | null
          team_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          player_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const