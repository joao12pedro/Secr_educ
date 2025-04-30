from supabase import create_client, Client

# Configurações do seu projeto Supabase
SUPABASE_URL = "https://fyqpphekxrebwpndfvub.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5cXBwaGVreHJlYndwbmRmdnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MjYxNzgsImV4cCI6MjA1OTEwMjE3OH0.b0chXkqI9zh3xFa2PBBTPeeseJzw2KzhHehHyp_5ouQ"

# Inicializa o cliente Supabase
def connect_db():
      return create_client(SUPABASE_URL, SUPABASE_KEY)