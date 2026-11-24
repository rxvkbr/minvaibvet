#!/bin/bash
# One-time setup, run in Google Cloud Shell: lets GitHub Actions upload to Google Play
# without any stored key (Workload Identity Federation, limited to rxvkbr/minvaibvet).
set -euo pipefail
REPO=rxvkbr/minvaibvet
P=$(gcloud projects list --filter="name:'Minvaibvet CI'" --format='value(projectId)' | head -1)
if [ -z "$P" ]; then
  P=minvaibvet-ci-$RANDOM
  gcloud projects create "$P" --name='Minvaibvet CI'
fi
gcloud config set project "$P" >/dev/null
gcloud services enable androidpublisher.googleapis.com iamcredentials.googleapis.com sts.googleapis.com iam.googleapis.com
SA=play-uploader@$P.iam.gserviceaccount.com
gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 || gcloud iam service-accounts create play-uploader --display-name='Play uploader (GitHub Actions)'
gcloud iam workload-identity-pools describe github --location=global >/dev/null 2>&1 || gcloud iam workload-identity-pools create github --location=global --display-name=GitHub
gcloud iam workload-identity-pools providers describe minvaibvet --location=global --workload-identity-pool=github >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools providers create-oidc minvaibvet --location=global --workload-identity-pool=github \
    --issuer-uri=https://token.actions.githubusercontent.com \
    --attribute-mapping='google.subject=assertion.sub,attribute.repository=assertion.repository' \
    --attribute-condition="assertion.repository=='$REPO'"
PN=$(gcloud projects describe "$P" --format='value(projectNumber)')
gcloud iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PN/locations/global/workloadIdentityPools/github/attribute.repository/$REPO" >/dev/null
echo
echo "=================== ГОТОВО ==================="
echo "SA=$SA"
echo "PROVIDER=projects/$PN/locations/global/workloadIdentityPools/github/providers/minvaibvet"
