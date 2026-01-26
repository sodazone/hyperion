#!/usr/bin/env bash

#wrk -t8 -c50 -d10s 'http://localhost:8080/v1/public/category/TA3941uFAvmVibSkQ6fMJXxmaSNovX86mz/4/0/1792?exists=true'
wrk -t8 -c50 -d10s 'http://localhost:8080/v1/public/category/0x382dda7599ea282e91b81f4a5faf82cc616f783817c2b7f85add1d0db101ea6a/9/5/257?exists=true'
#wrk -t8 -c50 -d10s 'http://localhost:8080/v1/public/category/TA3941uFAvmVibSkQ6fMJXxmaSNovX86mz/4/0/1792'
#wrk -t8 -c50 -d10s 'http://localhost:8080/v1/public/address/16UZJxDhtiCDhDG9o8txNQRAJLMPDNSJPkactNf9X99HXfuP'
