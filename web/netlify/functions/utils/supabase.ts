export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      airdrops: {
        Row: {
          address: string;
          chain_ids: number[];
          direct_holding: number;
          id: number;
          indirect_holding: number;
          is_poh: boolean;
          seer_tokens_count: number;
          share_of_holding: number;
          share_of_holding_poh: number;
          timestamp: string;
          total_holding: number;
        };
        Insert: {
          address: string;
          chain_ids: number[];
          direct_holding: number;
          id?: number;
          indirect_holding: number;
          is_poh: boolean;
          seer_tokens_count: number;
          share_of_holding: number;
          share_of_holding_poh: number;
          timestamp: string;
          total_holding: number;
        };
        Update: {
          address?: string;
          chain_ids?: number[];
          direct_holding?: number;
          id?: number;
          indirect_holding?: number;
          is_poh?: boolean;
          seer_tokens_count?: number;
          share_of_holding?: number;
          share_of_holding_poh?: number;
          timestamp?: string;
          total_holding?: number;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          created_at: string | null;
          id: number;
          name: string;
          updated_at: string | null;
          url: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          name: string;
          updated_at?: string | null;
          url?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          name?: string;
          updated_at?: string | null;
          url?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      collections_markets: {
        Row: {
          collection_id: number | null;
          id: number;
          market_id: string;
          user_id: string;
        };
        Insert: {
          collection_id?: number | null;
          id?: number;
          market_id: string;
          user_id: string;
        };
        Update: {
          collection_id?: number | null;
          id?: number;
          market_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_markets_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorite_markets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      curate: {
        Row: {
          chain_id: number;
          item_id: string;
          metadata: Json | null;
          metadata_path: string;
        };
        Insert: {
          chain_id: number;
          item_id: string;
          metadata?: Json | null;
          metadata_path: string;
        };
        Update: {
          chain_id?: number;
          item_id?: string;
          metadata?: Json | null;
          metadata_path?: string;
        };
        Relationships: [];
      };
      key_value: {
        Row: {
          id: number;
          key: string;
          value: Json;
        };
        Insert: {
          id?: number;
          key: string;
          value: Json;
        };
        Update: {
          id?: number;
          key?: string;
          value?: Json;
        };
        Relationships: [];
      };
      markets: {
        Row: {
          categories: string[] | null;
          chain_id: number | null;
          chart_data: Json | null;
          created_at: string | null;
          creator: string | null;
          id: string;
          images: Json | null;
          incentive: number | null;
          liquidity: number | null;
          metadata: Json | null;
          odds: number[] | null;
          opening_ts: number | null;
          parent_outcome: string | null;
          payout_numerators_value: number | null;
          payout_reported: boolean | null;
          pool_balance: Json;
          status: string | null;
          subgraph_data: Json | null;
          updated_at: string | null;
          url: string | null;
          verification: Json | null;
        };
        Insert: {
          categories?: string[] | null;
          chain_id?: number | null;
          chart_data?: Json | null;
          created_at?: string | null;
          creator?: string | null;
          id: string;
          images?: Json | null;
          incentive?: number | null;
          liquidity?: number | null;
          metadata?: Json | null;
          odds?: number[] | null;
          opening_ts?: number | null;
          parent_outcome?: string | null;
          payout_numerators_value?: number | null;
          payout_reported?: boolean | null;
          pool_balance?: Json;
          status?: string | null;
          subgraph_data?: Json | null;
          updated_at?: string | null;
          url?: string | null;
          verification?: Json | null;
        };
        Update: {
          categories?: string[] | null;
          chain_id?: number | null;
          chart_data?: Json | null;
          created_at?: string | null;
          creator?: string | null;
          id?: string;
          images?: Json | null;
          incentive?: number | null;
          liquidity?: number | null;
          metadata?: Json | null;
          odds?: number[] | null;
          opening_ts?: number | null;
          parent_outcome?: string | null;
          payout_numerators_value?: number | null;
          payout_reported?: boolean | null;
          pool_balance?: Json;
          status?: string | null;
          subgraph_data?: Json | null;
          updated_at?: string | null;
          url?: string | null;
          verification?: Json | null;
        };
        Relationships: [];
      };
      notifications_queue: {
        Row: {
          created_at: string;
          data: Json;
          email: string;
          event_id: string;
          id: number;
          sent_at: string | null;
        };
        Insert: {
          created_at?: string;
          data: Json;
          email: string;
          event_id: string;
          id?: number;
          sent_at?: string | null;
        };
        Update: {
          created_at?: string;
          data?: Json;
          email?: string;
          event_id?: string;
          id?: number;
          sent_at?: string | null;
        };
        Relationships: [];
      };
      ser_lpp_balances: {
        Row: {
          address: string;
          balance: number;
          chain_id: number;
          id: string;
        };
        Insert: {
          address: string;
          balance: number;
          chain_id: number;
          id: string;
        };
        Update: {
          address?: string;
          balance?: number;
          chain_id?: number;
          id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          email: string;
          email_verified: boolean;
          id: string;
          last_login_at: string | null;
          verification_token: string | null;
        };
        Insert: {
          email?: string;
          email_verified?: boolean;
          id: string;
          last_login_at?: string | null;
          verification_token?: string | null;
        };
        Update: {
          email?: string;
          email_verified?: boolean;
          id?: string;
          last_login_at?: string | null;
          verification_token?: string | null;
        };
        Relationships: [];
      };
      weather_markets: {
        Row: {
          answered: boolean;
          chain_id: number;
          city: string;
          created_at: string;
          date: string;
          id: number;
          opening_time: string;
          tx_hash: string;
        };
        Insert: {
          answered?: boolean;
          chain_id: number;
          city: string;
          created_at?: string;
          date: string;
          id?: number;
          opening_time: string;
          tx_hash: string;
        };
        Update: {
          answered?: boolean;
          chain_id?: number;
          city?: string;
          created_at?: string;
          date?: string;
          id?: number;
          opening_time?: string;
          tx_hash?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      markets_search: {
        Row: {
          block_timestamp: number | null;
          categories: string[] | null;
          chain_id: number | null;
          chart_data: Json | null;
          collections_names: string | null;
          created_at: string | null;
          creator: string | null;
          id: string;
          images: Json | null;
          incentive: number | null;
          is_closed: number | null;
          is_underlying_worthless: number | null;
          liquidity: number | null;
          market_name: string | null;
          metadata: Json | null;
          odds: number[] | null;
          opening_ts: number | null;
          outcomes: Json | null;
          outcomes_text: string | null;
          parent_market: Json | null;
          parent_outcome: string | null;
          payout_numerators_value: number | null;
          payout_reported: boolean | null;
          pool_balance: Json;
          status: string | null;
          subgraph_data: Json | null;
          updated_at: string | null;
          url: string | null;
          verification: Json | null;
          verification_priority: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_decompress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_options: {
        Args: { "": unknown };
        Returns: undefined;
      };
      gtrgm_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      set_limit: {
        Args: { "": number };
        Returns: number;
      };
      show_limit: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      show_trgm: {
        Args: { "": string };
        Returns: string[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
