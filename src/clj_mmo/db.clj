(ns clj-mmo.db
 (:use lamina.core clj-mmo.base clj-mmo.util)
 (:require [monger.core :as mg] [monger.collection :as mc] )) 

(prn "Connecting to Mongo " (System/getenv "MONGOLAB_URI"))
(mg/connect-via-uri! (System/getenv "MONGOLAB_URI" ) )

(defn get_player [ all_players id ] 
	(get @all_players id))


(defn persist_player [ k r old_p new_p ] 
	(if 
		(not= new_p old_p) 
			(do 
				(prn "saving player" new_p) 
				(mc/save "mkusers" (dissoc new_p :channel :adjacency) ) 
				new_p)
			(do 
				(prn "player did not change" )
					new_p)))


(defn get_all_players [ ] 
	(apply merge 
		(map (fn [ m ]  
			{ (first m) (add-watch (agent (second m)) :persist persist_player ) } )
			(determine_adjacency (apply merge (for [ x (mc/find-maps "mkusers" ) ] { (:_id x) (assoc x :channel (channel)) }  ))))))

