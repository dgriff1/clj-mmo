(ns clj-mmo.db
 (:use lamina.core)
 (:require [monger.core :as mg] [monger.collection :as mc] )) 

(prn "Connecting to Mongo " (mg/connect-via-uri! (System/getenv "MONGOLAB_URI" ) ))

(defn get_player [ all_players id ] 
	(get @all_players id))


(defn persist_player [ k r old_p new_p ] 
	(if 
		(not= new_p old_p) 
			(do 
				(prn "saving player" new_p) 
				(mc/save "mkusers" (dissoc new_p :channel) ) 
				new_p)
			(do 
				(prn "player did not change" )
					new_p)))

(defn get_all_players [ ] 
	(apply merge (for [ x (mc/find-maps "mkusers" ) ] { (:_id x) (add-watch (agent (assoc x :channel (channel))) :persist persist_player)  }  )) )

(defn safe_player [ p ] 
	(dissoc p :channel))
