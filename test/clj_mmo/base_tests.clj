(ns clj-mmo.base-tests
  (:use clojure.test
        clj-mmo.base))

(deftest a-test
	(let [p-one (player-rec "1234" [:sword], {:strength 1}, {:building  0})]
		(is "1234" (:id p-one))
		(is [:sword]  (:items p-one))
		(is {:strength 1}  (:attributes p-one))
		(is {:building 0}  (:techtree p-one))
  )) 
