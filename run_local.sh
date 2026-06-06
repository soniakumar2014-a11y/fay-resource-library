#!/bin/bash
# Run this script to start the local dev server
# Usage: double-click this file in Finder, or run: bash run_local.sh

echo "Starting Fay Resource Library locally..."
echo "Open http://localhost:8080 in your browser"
echo "Press Ctrl+C to stop"
echo ""
cd "$(dirname "$0")"
python3 -m http.server 8080
