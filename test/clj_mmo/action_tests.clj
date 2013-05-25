(ns clj-mmo.action-tests
	(:use clojure.test
		clj-mmo.base
		clj-mmo.actions))

(defn player-factory []
	(player-rec "1234" [:sword] (player-attributes) {:building  0}) 	)

(deftest bad-move-test
	(let [ player (player-factory) evt { :action "garbage_event" :target_x 10 :target_y 10 } ctx {} ]
		(is (= false (move? player evt ctx )))))

(deftest good-move-test
	(let [ player (player-factory) evt { :action "move" :target_x 8 :target_y 2 } ctx {} ]
		(is (= true (move? player evt ctx)))
		(let [new-player (move player evt ctx)]
			(is (= 8 (:x (:location new-player))))
			(is (= 2 (:y (:location new-player))))
		)))


(deftest trigger-action-test
	(let [ event { :xcoord 12 :ycoord 14} p-one (player-rec "1234" [:sword] (player-attributes) {:building  0}) a-one (on_move p-one event {:terrain nil} ) ]
		(prn p-one)	
))


(deftest determine-action-test
	(let [ player (player-factory) evt { :action "move" :target_x 15 :target_y 10 } ctx {} ]
		(let [ moved_p (determine-action (assoc player :location {:x 14 :y 9})  evt ctx)]  
			(prn "Moved " moved_p  " old " player)
			(is (= (:y (:old_location moved_p)) 9 ))
			(is (= (:x (:old_location moved_p)) 14 ))
			(is (= (:y (:location moved_p)) 10 ))
			(is (= (:x (:location moved_p)) 15 ))
		)))
	
