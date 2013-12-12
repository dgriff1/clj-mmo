# clj-mmo

# setup 

1. get mongo running
1a. In the Mongo shell do "use mk" and " db.mkentities.ensureIndex( { "location": "2d" } ) "
2. update your bashrc/profile whatever so it is like this 

    export MONGOLAB_URI="mongodb://127.0.0.1:27017/mk"
3. Don't be an idiot about updating that url, you just need to point to mk instead of runlater
4. make sure you source your bashrc or whatever so you get the new env variable
5. go into 

    clj-mmo/src/clj_mmo/core.clj
6. Uncomment:  This will create a user when you start the server (only do it once) 

    (def p-one (mmo/player-rec "1234" [:sword], {:strength 1}, {:building  0}))

    (db/persist_player p-one nil )
6. Start the server with foreman start, don't actually connect or anything. 
7. Kill it and comment those lines of code out. 
8. Restart it and make sure you connect to object/1234 
