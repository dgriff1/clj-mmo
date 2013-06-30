(ns clj-mmo.base-tests
  (:use clojure.test
        clj-mmo.base))

(deftest create-player-test
	(let [p-one (player-rec "1234" [:sword], (player-attributes), {:building  0})]
		(is "1234" (:id p-one))
		(is [:sword]  (:items p-one))
		(is 3 (:mental (:attributes p-one)))
		(is 3 (:meat (:attributes p-one)))
		(is 3 (:might (:attributes p-one)))
		(is 100 (:asphyxiation (:attributes p-one)))
		(is 100 (:thirst (:attributes p-one)))
		(is 100 (:hunger (:attributes p-one)))
		(is 100 (:exposure (:attributes p-one)))
		(is {:building 0}  (:techtree p-one))
		(is []  (:actions p-one))
		(is []  (:behaviors p-one))
  )) 

(deftest create-action-test
	(let [ event {:to 123}  p-one (player-rec "1234" [:sword] (player-attributes) {:building  0}) a-one (on_move p-one event {:terrain nil} ) ]
		(prn p-one)	
))

(deftest proximity-test 
	(let [ all_players 
			(list
				(assoc (player-rec "1" [:sword] (player-attributes) {:building  0}) :location { :x 1000 :y 2000} :old_location { :x 9999 :y 20001}    )
				(assoc (player-rec "2" [:sword] (player-attributes) {:building  0}) :location { :x 500 :y 1500 } )
				(assoc (player-rec "3" [:sword] (player-attributes) {:building  0}) :location { :x 0 :y 0} )
				(assoc (player-rec "4" [:sword] (player-attributes) {:building  0}) :location { :x 1500 :y 500} )
				(assoc (player-rec "5" [:sword] (player-attributes) {:building  0}) :location { :x 1500 :y 0} )
			) p  (assoc (player-rec "1" [:sword] (player-attributes) {:building  0}) :location { :x 1000 :y 2000} ) ] 
		(prn "Proximity " (check_proximity p all_players))))	

(defn adj_list [ kmap k ]  
	(get (deref (get kmap k)) :adjacency ))

(deftest adjacency-test 
	(let [ all_players 
				{ "1" (agent (assoc (player-rec "1" [:sword] (player-attributes) {:building  0}) :location { :x 1000 :y 2000} :old_location { :x 9999 :y 20001}    ))
				  "2" (agent (assoc (player-rec "2" [:sword] (player-attributes) {:building  0}) :location { :x 500 :y 1800 } ))
				  "3" (agent (assoc (player-rec "3" [:sword] (player-attributes) {:building  0}) :location { :x 0 :y 0} ))
				  "4" (agent (assoc (player-rec "4" [:sword] (player-attributes) {:building  0}) :location { :x 1800 :y 2400} ))
				  "5" (agent (assoc (player-rec "5" [:sword] (player-attributes) {:building  0}) :location { :x 1500 :y 0} )) }  
				  with_adjacency (determine_adjacency all_players)  ]
		(is (contains? (adj_list with_adjacency "1") "2" ))
		(is (contains? (adj_list with_adjacency "1" ) "4"  ))
		(is (not (contains? (adj_list with_adjacency  "1") "1" )))
		(is (not (contains? (adj_list with_adjacency "1" ) "3" )))
		))	
	
