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

