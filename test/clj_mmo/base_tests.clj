(ns clj-mmo.base-tests
  (:use clojure.test
        clj-mmo.base))

(deftest create-player-test
	(let [p-one (player-rec "1234" [:sword], {:strength 1}, {:building  0})]
		(is "1234" (:id p-one))
		(is [:sword]  (:items p-one))
		(is {:strength 1}  (:attributes p-one))
		(is {:building 0}  (:techtree p-one))
		(is []  (:actions p-one))
		(is []  (:behaviors p-one))
  )) 

(deftest create-action-test
	(let [ a-one (stab (dec 1) ) ]
		(is []  (:actions a-one))
		(is []  (:behaviors a-one))
		(is 0 ((:action a-one) 1))
  ))


(deftest logic-test 
	(let [p-one (player-rec "1234" [:sword], {:strength 1}, {:building  0})]
		(prn "Stuff " (test_func p-one) )))

