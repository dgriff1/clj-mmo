(ns clj-mmo.core
 (:use 
 	compojure.core 
	aleph.http
	lamina.core
	clojure.data.json
	[ring.adapter.jetty :only [run-jetty]] 
	[clojure.walk :only [keywordize-keys]] 
 )
 (:require [compojure.route :as route]
 	[clj-mmo.db :as db ] 
 	[clj-mmo.util :as util ] 
	[clj-mmo.base :as mmo]
	[clj-mmo.actions :as actions]
	[ring.util.response :as resp]
	[compojure.handler :as handler])
)

(def all_players (agent (db/get_all_players)))

;(prn "All Players " @all_players)

;; this will create a user
;(def p-one (mmo/player-rec "45678" [:sword], {:strength 1}, {:building  0}))
;(db/persist_player nil nil nil p-one )
;(db/persist_entity { :location { :x 1 :y 10 } :type "terrain" :resource "terrain1.png" } )
;(db/persist_entity { :location { :x 4 :y 20 } :type "item" :resource "sword.png" } )
;(db/persist_entity { :location { :x 0 :y 0 } :type "terrain" :resource "tree.png" } )

(defn message-handler [ ch p msg params ] 
	(cond 
		(= (:type msg) "proximity" ) (json-str (db/get_close_entities (get-in msg :location :x ) (get-in msg :location :y ) ))
		:else  (let [ player (db/get_player all_players (:id params))]
						(do 
					  		(let [msg (json-str (util/safe_player @(send player actions/determine-action (read-json msg) {}))) ]
								(enqueue ch msg) 
								(mmo/send_to_adjacents ch @p @all_players)) ) ) ) )


(defn object-handler [ch request] 
	(let [ params (:route-params request) p  (db/get_player all_players (:id params)) ]
		(do 
			;(join ch (:channel @p))
			(send p assoc :socket ch) 
			(prn "En1 " (enqueue ch (json-str (util/safe_player @p) )))
			(prn "Grabbing adjacents " (get @p :adjacency))
			(mmo/grab_adjacents ch @p @all_players ) 
			(prn "Done grabbing adjacents " )
			(receive-all ch 
				(fn [ msg ] 
					(message-handler ch p msg params  )
				)
			)    
		)
	)
)

(defroutes main-routes
  	; what's going on
	(GET [ "/object/:id"] {} (wrap-aleph-handler object-handler))
	; fall backs 
	(GET "/" [] (resp/redirect "/index.html"))
	(route/resources "/")
	(route/not-found "Page not found")   
)


(def app
  (handler/api main-routes))

(defn -main [port]
 	(start-http-server (wrap-ring-handler main-routes)
 		{:host "localhost" :port (Integer/parseInt port) :websocket true}))	

