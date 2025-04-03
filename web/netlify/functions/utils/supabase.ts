export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
          created_at: string | null;
          creator: string | null;
          id: string;
          images: Json | null;
          incentive: number | null;
          liquidity: number | null;
          metadata: Json | null;
          odds: number[] | null;
          pool_balance: Json;
          subgraph_data: Json | null;
          updated_at: string | null;
          url: string | null;
          verification: Json | null;
        };
        Insert: {
          categories?: string[] | null;
          chain_id?: number | null;
          created_at?: string | null;
          creator?: string | null;
          id: string;
          images?: Json | null;
          incentive?: number | null;
          liquidity?: number | null;
          metadata?: Json | null;
          odds?: number[] | null;
          pool_balance?: Json;
          subgraph_data?: Json | null;
          updated_at?: string | null;
          url?: string | null;
          verification?: Json | null;
        };
        Update: {
          categories?: string[] | null;
          chain_id?: number | null;
          created_at?: string | null;
          creator?: string | null;
          id?: string;
          images?: Json | null;
          incentive?: number | null;
          liquidity?: number | null;
          metadata?: Json | null;
          odds?: number[] | null;
          pool_balance?: Json;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
