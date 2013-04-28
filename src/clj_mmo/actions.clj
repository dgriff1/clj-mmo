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
		(assoc-in [:location :x] (:target_x evt))
		(assoc-in [:location :y] (:target_y evt))
		)))

(defn  take_damage? [player evt ctx]
	true)

(defn take_damage [ player evt ctx]
	(assoc player :health 90))

; if then 
(defn if_then [ player evt ctx iffunc thenfunc ] 
	(if (iffunc player evt ctx) 
		(thenfunc player evt ctx)
		player)
)

; combining functions
(defn do_move [ player evt ctx ] 
	(->  player
		(if_then evt ctx move? move)
		))


(defn determine-action [ player evt ctx ] 
	(case 
		(:action evt) 
		"move" (do_move player evt ctx)))
		
