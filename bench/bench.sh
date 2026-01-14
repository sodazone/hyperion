#!/usr/bin/env bash

wrk -t8 -c50 -d10s http://localhost:8080/sanctions/urn:ocn:tron:0/TA3941uFAvmVibSkQ6fMJXxmaSNovX86mz
