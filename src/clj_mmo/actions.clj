(ns clj-mmo.actions) 

; All must be run with "evt" and "ctx" in context
; 

(defn move? [player evt ctx]
	(cond 
		(and 
			(= (:action evt) "move" ) 
			(contains? evt :target_x)
			(contains? evt :target_y))
			true
		:else false))

(defn move [player evt ctx]
	(do
		(prn "Moving player" evt)
	(-> player
		(assoc :old_location (:location player))
		(assoc-in [:location :x] (:target_x evt))
		(assoc-in [:location :y] (:target_y evt))
		)))

(defn chop? [player target evt ctx]
	(cond 
		(and 
			(= (:type evt) "chop")
			(= (:type player) "player")) true
	:else false))
	

(defn  take-damage? [player evt ctx]
	true)

(defn take-damage [ player evt ctx]
	(assoc player :health 90))

; if then 
(defn if-then [ player evt ctx iffunc thenfunc ] 
	(if (iffunc player evt ctx) 
		(thenfunc player evt ctx)
		player)
)

(defn is-a [ entity-types valid-type ]
	(if (list? entity-types) (some (partial = valid-type ) entity-types)
		(= entity-types valid-type)))
		
	

; combining functions
(defn do-move [ player evt ctx ] 
	(->  player
		(if-then evt ctx move? move)
		))

(defn determine-action [ player evt ctx ] 
	(case 
		(:action evt) 
			"move" (do-move player evt ctx)
			(do 
				(prn "Invalid event " evt ) 
				player)  ))
		
