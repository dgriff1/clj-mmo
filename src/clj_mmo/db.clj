(ns clj-mmo.db
 (:require [monger.core :as mg] [monger.collection :as mc] )) 

(prn "Connecting to Mongo " (mg/connect-via-uri! (System/getenv "MONGOLAB_URI" ) ))


(defn get_player [ id ] 
	(mc/find-one-as-map "mkusers" { :_id id }) ) 

(defn persist_player [ new_p old_p ] 
	(if 
		(not= new_p old_p) 
			(do 
				(prn "saving player" new_p) 
				(mc/save "mkusers" new_p) 
				new_p)
			(do 
				(prn "player did not change" )
					new_p)))




