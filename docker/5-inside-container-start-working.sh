
#nginx -g 'daemon off;' & 

cd /project 

npm run start 2>&1 | tee -a /storage/logs.txt 

#do-default
