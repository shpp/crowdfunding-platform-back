export MONGODB_URI="mongodb://admin:1234@localhost:27017/shpp-crowd-funding"
cp /state/.migrate /state/.migrate.backup
cp /state/.migrate /project/src/.migrate
cd /project/src && migrate
cp /project/src/.migrate /state/.migrate
