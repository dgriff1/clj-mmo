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


;; this will create a user
;; (def p-one (mmo/player-rec "1234" [:sword], {:strength 1}, {:building  0}))
;; (db/persist_player p-one nil )

(defn object-handler [ch request] 
	(let [ params (:route-params request) ]
		(do 
			(enqueue ch (json-str (db/get_player (:id params))))
			(receive-all ch 
				(fn [ msg ] 
					(let [ player (db/get_player (:id params))]
						(do 
					  		(prn "secondary message " msg )
					  		(enqueue ch 
					  			(json-str (actions/determine-action player (read-json msg) {})))
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
	(route/resources "/")
	(route/not-found "Page not found")   
)


(def app
  (handler/api main-routes))

(defn -main [port]
 	(start-http-server (wrap-ring-handler main-routes)
 		{:host "localhost" :port (Integer/parseInt port) :websocket true}))	

