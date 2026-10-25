#!/bin/sh
# Runs every offline server test (no network, mocked AI service). Pass no
# arguments. CI also runs this a second time with OPENCODE_API_KEY set, so each
# AI engine is checked against both OpenCode Go and DeepSeek.
set -e
cd "$(dirname "$0")/.."
for t in assessment_audit_test marking_input_test deployment_bundle_test marking_format_test marking_engine_test marking_resolution_test feedback_policy_test \
         marking_api_test marking_client_test feedback_client_test improvement_input_test improvement_engine_test \
         improvement_api_test improvement_evaluator_test marking_evaluator_test marking_summary_test \
         marking_storage_transport_test d1_adapter_test archive_test class_test ai_provider_test; do
  node "tests/$t.js" > /tmp/server-test-out.txt 2>&1 || { cat /tmp/server-test-out.txt; echo "FAILED: $t"; exit 1; }
  echo "ok  $t"
done
node scripts/evaluate-marking.js --validate --split all > /dev/null
sh tests/run_marking_store_test.sh > /dev/null
npm run --silent test:comparison > /dev/null
echo "All server tests passed (AI service: $(node -e "console.log(require('./server/ai-provider').current().label)"))."
