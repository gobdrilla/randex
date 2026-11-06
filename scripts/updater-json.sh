#!/usr/bin/env bash
# latest.json für den Tauri-Updater aus den .sig-Assets eines Releases bauen (Ausgabe auf stdout).
# Läuft einmal nach allen Builds: lädt jeder Matrix-Job sie selbst hoch, überschreiben sich parallele Uploads.
# Aufruf: scripts/updater-json.sh v1.2.3 (braucht gh, jq und GITHUB_REPOSITORY=owner/repo)
set -euo pipefail

tag=$1
url="https://github.com/$GITHUB_REPOSITORY/releases/download/$tag"
dir=$(mktemp -d)
gh release download "$tag" -R "$GITHUB_REPOSITORY" -p '*.sig' -D "$dir"

platforms='{}'
for sig in "$dir"/*.sig; do
  file=$(basename "$sig" .sig)
  case $file in
    *.AppImage) keys="linux-x86_64 linux-x86_64-appimage" ;;
    *.deb) keys="linux-x86_64-deb" ;;
    *.rpm) keys="linux-x86_64-rpm" ;;
    *_aarch64.app.tar.gz) keys="darwin-aarch64 darwin-aarch64-app" ;;
    *_x64.app.tar.gz) keys="darwin-x86_64 darwin-x86_64-app" ;;
    *.msi) keys="windows-x86_64 windows-x86_64-msi" ;;
    *-setup.exe) keys="windows-x86_64-nsis" ;;
    *) continue ;;
  esac
  for key in $keys; do
    platforms=$(jq --arg k "$key" --rawfile s "$sig" --arg u "$url/$file" '.[$k] = {signature: $s, url: $u}' <<<"$platforms")
  done
done

# Fehlt ein Build, lieber rot als ein Update-Manifest, das eine Plattform still auslässt
for key in darwin-aarch64 darwin-x86_64 linux-x86_64 windows-x86_64; do
  jq -e --arg k "$key" 'has($k)' <<<"$platforms" >/dev/null || { echo "Signatur für $key fehlt" >&2; exit 1; }
done

jq -n \
  --arg v "${tag#v}" \
  --arg n "$(gh release view "$tag" -R "$GITHUB_REPOSITORY" --json body -q .body)" \
  --arg d "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson p "$platforms" \
  '{version: $v, notes: $n, pub_date: $d, platforms: $p}'
