#!/usr/bin/env bash

wrk -t8 -c50 -d10s 'http://localhost:8080/v1/public/category/TA3941uFAvmVibSkQ6fMJXxmaSNovX86mz/4/0/1792?exists=true'
#wrk -t8 -c50 -d10s 'http://localhost:8080/v1/public/category/TA3941uFAvmVibSkQ6fMJXxmaSNovX86mz/4/0/1792'
#wrk -t8 -c50 -d10s 'http://localhost:8080/v1/public/address/16UZJxDhtiCDhDG9o8txNQRAJLMPDNSJPkactNf9X99HXfuP'
