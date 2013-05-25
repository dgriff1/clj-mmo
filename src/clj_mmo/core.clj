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
	[clj-mmo.base :as mmo]
	[clj-mmo.actions :as actions]
	[ring.util.response :as resp]
	[compojure.handler :as handler])
)

(def all_players (agent (db/get_all_players)))

(prn "All Players " @all_players)

;; this will create a user
;; (def p-one (mmo/player-rec "1234" [:sword], {:strength 1}, {:building  0}))
;; (db/persist_player nil nil nil p-one )

(defn object-handler [ch request] 
	(let [ params (:route-params request) p  @(db/get_player all_players (:id params)) ]
		(do 
			(enqueue ch (json-str (db/safe_player p) ))
			(siphon (:channel p) ch) 
			(receive-all ch 
				(fn [ msg ] 
					(let [ player (db/get_player all_players (:id params))]
						(do 
							(do "msg is " (read-json msg))
					  		(enqueue ch 
					  			(json-str (db/safe_player @(send player actions/determine-action (read-json msg) {}))))
						)
					)
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

