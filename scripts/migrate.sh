export MONGODB_URI="mongodb://admin:1234@localhost:27017/shpp-crowd-funding"
node -e "require('./src/migrations/2020042200-camel-case-to-underscore.js').up()"
node -e "require('./src/migrations/2020042201-add-multilingual-fields-to-projects.js').up()"
node -e "require('./src/migrations/2020042202-seed-shpp-kowo-project.js').up()"
