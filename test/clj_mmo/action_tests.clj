(ns clj-mmo.action-tests
	(:use clojure.test
		clj-mmo.base
		clj-mmo.actions))

(defn player-factory []
	(player-rec "1234" [:sword] (player-attributes) {:building  0}) 	)


(deftest is-a-test 
	(is (not (is-a (list "tree", "horse"), "grass")))
	(is (not (is-a "tree", "grass")))
	(is (is-a "tree", "tree"))
	(is (is-a (list "house", "tree"), "tree")))


(deftest bad-move-test
	(let [ player (player-factory) evt { :action "garbage_event" :target_x 10 :target_y 10 } ]
		(is (= false (move? player evt )))))

(deftest good-move-test
	(let [ player (player-factory) evt { :action "move" :target_x 8 :target_y 2 } ]
		(is (= true (move? player evt )))
		(let [new-player (:player (move player evt ))]
			(is (= 8 (:x (:location new-player))))
			(is (= 2 (:y (:location new-player))))
		)))


(deftest determine-action-test
	(let [ player (player-factory) evt { :action "move" :target_x 15 :target_y 10 } ]
		(let [ moved_p (determine-action (assoc player :location {:x 14 :y 9}) evt (list) )]  
			(prn "Moved " moved_p  " old " player)
			(is (= (:y (:old_location moved_p)) 9 ))
			(is (= (:x (:old_location moved_p)) 14 ))
			(is (= (:y (:location moved_p)) 10 ))
			(is (= (:x (:location moved_p)) 15 ))
		)))
	
