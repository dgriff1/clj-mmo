(ns clj-mmo.db
 (:use lamina.core clj-mmo.base clj-mmo.util )
 (:require [monger.core :as mg] [monger.collection :as mc] monger.json )
 (:import org.bson.types.ObjectId)) 

(prn "Connecting to Mongo " (System/getenv "MONGOLAB_URI"))
(mg/connect-via-uri! (System/getenv "MONGOLAB_URI" ) )

(mc/ensure-index "mkentities" (array-map "location" "2d") { :min -500000 :max 500000 } ) 

(defn -main []
	(mc/drop-indexes "mkentities"))


(defn get-player [ all_players id ] 
	(get @all_players id))


(defn persist-player [ k r old_p new_p ] 
	(if 
		(not= new_p old_p) 
			(do 
				(mc/save "mkusers" (dissoc new_p :channel :adjacency :socket) ) 
				new_p)
			(do 
					new_p)))


(defn persist-entity [ entity ] 
	(mc/save "mkentities" (assoc entity :_id (ObjectId.)) ))

(defn get-all-players [ ] 
	(determine-adjacency 
	 	(apply merge (for [ x (mc/find-maps "mkusers" ) ] { (:_id x) (add-watch (agent (assoc x :channel (channel))) :persist persist-player)  }  ))))

(defn get-close-entities [ fromx fromy ] 
	;(let [ closeby (mc/find-maps "mkentities" { :location { "$near" [ fromx fromy ] "$maxDistance" 800 } } )] 
	(let [ closeby (mc/find-maps "mkentities" { :location { "$geoWithin" { "$center" [[fromx, fromy], 800] } }} )] 
		(prn "Close entities " fromx " - " fromy " = " closeby) closeby  ))

(defn delete-all-entities [ ] 
	(mc/remove "mkentities"))
