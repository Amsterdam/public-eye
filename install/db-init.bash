#!/bin/bash
set -e

DB_NAME=eagle_eye

for mig_file in `ls migrations/*`; do
  psql -d $DB_NAME < $mig_file
done