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
	[monger core util]
	[clj-mmo.base :as mmo]
	[ring.util.response :as resp]
	[compojure.handler :as handler])
)

(def p-one (mmo/player-rec "1234" [:sword], {:strength 1}, {:building  0}))

(defn object-handler [ch request] 
	(let [ params (:route-params request) ]
		(do 
			(prn "Got a message " ch " -- "  params )
			(enqueue ch (json-str p-one))
			(receive ch 
				(fn [ msg ] 
					(prn "Got New Message  " msg) 
					(enqueue ch (json-str p-one))
				)))))

(defroutes main-routes
  	; what's going on
	(GET [ "/object/:id"] {} (wrap-aleph-handler object-handler))
	; fall backs 
	(route/resources "/")
	(route/not-found "Page not found")   
)

;(prn "Connecting to " (System/getenv "MONGOLAB_URI"))
;(prn (monger.core/connect-via-uri! (System/getenv "MONGOLAB_URI" ) ))

(def app
  (handler/api main-routes))

(defn -main [port]
 	(start-http-server (wrap-ring-handler main-routes)
 		{:host "localhost" :port (Integer/parseInt port) :websocket true}))	

