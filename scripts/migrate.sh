export MONGODB_URI="mongodb://admin:1234@localhost:27017/shpp-crowd-funding"
rm -rf /state/migrations/
cp -R /project/src/migrations /state/migrations
cd /state && migrate
