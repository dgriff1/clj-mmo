(ns clj-mmo.actions
	(:require [clj-mmo.db :as clj-db]))

; All must be run with "evt" and "ctx" in context
; 

(defn is-a [ entity-types valid-type ]
	(if (list? entity-types) (some (partial = valid-type ) entity-types)
		(= entity-types valid-type)))

(defn move? [player evt ]
	(cond 
		(and 
			(= (:action evt) "move" ) 
			(contains? evt :target_x)
			(contains? evt :target_y))
			true
		:else false))

(defn move [player evt ]
	(do
		{:player (-> player
			(assoc :old_location (:location player))
			(assoc-in [:location :x] (:target_x evt))
			(assoc-in [:location :y] (:target_y evt))
			(assoc-in [:location :direction] (:direction evt)))}))

(defn chop? [player evt ]
	(cond 
		(and 
			(contains? evt :target) ) true
	:else false))

(defn chop [player evt ]
	(let [entity (clj-db/get-entity (:target evt)) ] 
		{:entities (list 
			(-> entity 
				(assoc :health (- (get entity :health 100) 5))))
		:player player }))


(defn  take-damage? [player evt ]
	true)

(defn take-damage [ player evt ]
	(assoc player :health 90))

; if then 
(defn if-then [ player evt iffunc thenfunc ] 
	(if (iffunc player evt ) 
		(thenfunc player evt )
		{:player player})
)

(defn determine-action [ player evt all_players ] 
	(clj-db/persist-action-results all_players
		(case 
			(:action evt) 
				"move" (if-then player evt move? move )
				"chop" (if-then player evt chop? chop )
				{:player player})))
		
