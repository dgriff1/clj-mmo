(ns clj-mmo.db
 (:use lamina.core clj-mmo.base clj-mmo.util )
 (:require [monger.core :as mg] [monger.collection :as mc] monger.json )
 (:import org.bson.types.ObjectId)) 

(prn "Connecting to Mongo " (System/getenv "MONGOLAB_URI"))
(mg/connect-via-uri! (System/getenv "MONGOLAB_URI" ) )

(mc/ensure-index "mkentities" (array-map "location" "2d") { :min -5000 :max 5000 } ) 

(defn get_player [ all_players id ] 
	(get @all_players id))


(defn persist_player [ k r old_p new_p ] 
	(if 
		(not= new_p old_p) 
			(do 
				(mc/save "mkusers" (dissoc new_p :channel :adjacency :socket) ) 
				new_p)
			(do 
					new_p)))


(defn persist_entity [ entity ] 
	(mc/save "mkentities" (assoc entity :_id (ObjectId.)) ))

(defn get_all_players [ ] 
	(determine_adjacency 
	 	(apply merge (for [ x (mc/find-maps "mkusers" ) ] { (:_id x) (add-watch (agent (assoc x :channel (channel))) :persist persist_player)  }  ))))

(defn get_close_entities [ fromx fromy ] 
	(mc/find-maps "mkentities" { :location { "$near" [ fromx fromy ] "$maxDistance" 400 } } ))

(defn delete_all_entities [ ] 
	(mc/remove "mkentities"))
