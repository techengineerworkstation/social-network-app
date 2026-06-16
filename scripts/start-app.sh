#!/bin/bash
# Wrapper script for systemd — avoids space-in-path issues
cd "/home/hptechworkpc/Apps/Social Network Program/social-network-app"
exec /usr/bin/node node_modules/.bin/next start -p 8899
