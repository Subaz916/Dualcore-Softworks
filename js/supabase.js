/* ============================================================
   DUALCORE SOFTWORKS — supabase.js
   Supabase client setup (loaded from CDN in each page)
   ============================================================ */
(function () {
  'use strict';

  window.SUPABASE_URL = 'https://btwraaddpyvmfjunejem.supabase.co';
  window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0d3JhYWRkcHl2bWZqdW5lamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5OTY4NzYsImV4cCI6MjEwMTU3Mjg3Nn0.qAVZGBfmCx_OFjKQUxUJ_Y1yrhhSzpdrmfXycDRsBjM';

  const sdk = window.supabase;
  window.supabase = null;

  if (sdk && sdk.createClient) {
    window.supabase = sdk.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );
  }
})();
