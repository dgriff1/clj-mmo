(ns clj-mmo.actions) 

; All must be run with "evt" and "ctx" in context
; 

(defn move? [player evt ctx]
	(cond 
		(and 
			(= (:action evt) "on_move" ) 
			(contains? evt :target_x)
			(contains? evt :target_y))
			true
		:else false))

(defn move [player evt ctx]
	(-> player
		(assoc-in [:location :x] (:target_x evt))
		(assoc-in [:location :y] (:target_y evt))
		))

(defn  take_damage? [player evt ctx]
	true)

(defn take_damage [ player evt ctx]
	(assoc player :health 90))

