yarn && yarn build
rm -rf /var/www/eagle_eye/*
cp -r build/* /var/www/eagle_eye/
