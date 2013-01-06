(ns clj-mmo.core
 (:use compojure.core [ring.adapter.jetty :only [run-jetty]] [clojure.walk :only [keywordize-keys]] )
 (:require [compojure.route :as route]
	[monger core util]
	[ring.util.response :as resp]
	[compojure.handler :as handler])
)

(defroutes main-routes
  	; what's going on
	; fall backs 
	(GET "/" [] (resp/redirect "/index.html"))
	(route/resources "/")
	(route/not-found "Page not found")   
)

(prn "Connecting to " (System/getenv "MONGOLAB_URI"))
(prn (monger.core/connect-via-uri! (System/getenv "MONGOLAB_URI" ) ))

(def app
  (handler/api main-routes))

(defn -main [port]
	(run-jetty app {:port (Integer. port)}))

