#!/bin/bash
SVC="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmc21wcXhuaXN3ZG5zeXdqemplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg1MTUyNiwiZXhwIjoyMTAxNDI3NTI2fQ.yqdgbMNuqU3qwuXlgbl5yGcIbgxDCOHnUi0WZ8k8eo8"
BASE="https://ufsmpqxniswdnsywjzje.supabase.co/rest/v1"
for tbl in spatial_sources spatial_imports spatial_datasets spatial_pipeline_runs spatial_staged_features risk_registers risks risk_revisions compliance_obligations controls control_tests evidence_records findings remediation_actions gis_audit_log; do
  result=$(curl -s --max-time 10 -H "apikey: $SVC" -H "Authorization: Bearer $SVC" "$BASE/$tbl?select=id&limit=1")
  if echo "$result" | grep -q "42P01"; then
    echo "MISSING: $tbl"
  elif echo "$result" | grep -q "42501"; then
    echo "RLS_ISSUE: $tbl"
  elif echo "$result" | grep -q "^\["; then
    echo "OK: $tbl"
  else
    echo "ERR $tbl: $(echo $result | cut -c1-80)"
  fi
done
