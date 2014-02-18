(ns clj-mmo.base
	(:require [clj-mmo.util :as util] )
	(:use lamina.core clojure.data.json [ clojure.contrib.core :only [ dissoc-in]] ))

(defn base-type [ target ]  
	(merge  {:actions [] :behaviors []} target))

(defn entity [ ename edef ] 
	(assoc (base-type edef) :name ename))

(defn action [ body ] 
	(base-type {:action (fn [t] body)}  ))

(defn behavior [ guard body ] 
	(fn [source target action] guard body))

(defn tech [ body ] 
	(fn [source target activity] (base-type body)))

(defn player-attributes [ ]
	{ :might 3 :meat 3 :mental 3 :asphyxiation 100 :thirst  100 :hunger 100 :exposure 100 })

(defn player-rec [id items attributes techtree] 
	(entity "player" { :_id id :attributes attributes :techtree techtree :conditions [] :health 100 :location { :x 0 :y 0} :channel (channel) }) ) 

; this sends off the association to 2 agents
(defn set-agent-adjacency [ p other_p]
	(if 
		(not (contains? (:adjacency @p) (:_id other_p)))
			(let [ bridge (channel) ] 
				(join (:channel @p) bridge (:channel @other_p))
				(join (:channel @other_p) bridge (:channel @p))
				(send p assoc :adjacency (merge (get @p :adjacency {}) { (:_id @other_p) bridge }))
				(send other_p assoc :adjacency (merge (get @other_p :adjacency {}) { (:_id @p) bridge }))
				(receive-all bridge
					(fn [ msg ] (prn "Msg is " msg ) ) ))
		p))

; this sends off the disassociation to the relevant agents
(defn unset-agent-adjacency [ p other_p]
		(let [ bridge (get-in @p [:adjacency (:_id @other_p) ] ) ]
			(if 
				(nil? bridge) p
				(do 
					(close bridge)
					(send p dissoc-in [ :adjacency (:_id @other_p) ] )
					(send other_p dissoc-in [ :adjacency (:_id @p) ] )))))

(defn entering? [ p_loc other_loc ] 
	(if (nil? other_loc) true true))

(defn check-proximity [  p allplayers ] 
	(let [ x (get-in @p [:location :x]) y (get-in @p [:location :y] ) c (:channel @p)  ]
		(map (fn [ close_p ] 
				(if (entering? (:location @p) (:old_location @close_p)) (set-agent-adjacency p close_p)
					(unset-agent-adjacency p close_p)	
				))
			(filter (fn [ ptwo ] 
				(let [ px (get-in @ptwo [:location :x]) py (get-in @ptwo [:location :y])]
					(if (or 
							; equal to Y and inside the range of X
							(and 
								(= py y)
								(and (> px (- x 800)) (< px (+ x 800))) )
							; equal to X and inside the range of Y
							(and 
								(= px x)
								(and (> py (- y 400)) (< py (+ y 400))) )
						)
							true 
							false))) allplayers))))

(defn connect-all [ p others] 
	(if (empty? others )
		p
		(do 
			(set-agent-adjacency p (first others))
			(connect-all p (rest others)))))

(defn close? [ p other_p ] 
	(let [  x (get-in p [:location :x]) y (get-in p [:location :y] )
			px (get-in other_p [:location :x]) py (get-in other_p [:location :y]) ]
		(and 
			(and (>= px (- x 800)) (<= px (+ x 800))) 
			(and (>= py (- y 400)) (<= py (+ y 400))))  ))

; this is for start up connections
(defn determine-adjacency 
	 [ players ] 
	 (dorun (map (fn [ p ] 
		(connect-all p (filter (fn [ other_p ] 
			(if 
				(= (:_id @p) (:_id @other_p)) false
				(close? @p @other_p) )) (vals players)))) (vals players)))
		players)
	 	
(defn grab-adjacents [ch p all_players ] 
	(doall (map (fn [ p_id ]
		(let [ other_p (get all_players p_id  ) ] 
			(prn "Sending other player " other_p)
			(enqueue ch (json-str (util/safe-player @other_p))))) (keys (get p :adjacency {})))))

(defn send-to-adjacents [ch p all_players ] 
	(doall (map (fn [ p_id ]
		(let [ other_p (get all_players p_id  ) ] 
			(if (contains? @other_p :socket) 
				(do 
					(prn "sending to other_p " (:socket @other_p)) (enqueue (:socket @other_p) (json-str (util/safe-player p))))))) (keys (get p :adjacency {})))))

(defn publish-to-close-players [ e all_players ] 
	(doall (map (fn [p] 	
					(if (close? e @p) 
						(enqueue (:socket @p) (json-str (e))))) @all_players)))
