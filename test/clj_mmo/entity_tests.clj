(ns clj-mmo.entity-tests
  (:use clojure.test
        clj-mmo.db))

(deftest create-entity-test
	(delete-all-entities) 
	(let 
		[
			e-one (persist-entity { :location { :x 0 :y 0 } :type "terrain" :resource "mud.png" } ) 
			e-two (persist-entity { :location { :x 0 :y 0 } :type "tree" :resource "tree.png" } )  
			e-three (persist-entity { :location { :x 701 :y 0 } :type "tree" :resource "tree.png" } )  
			e-four (persist-entity { :location { :x 0 :y 701 } :type "tree" :resource "tree.png" } )  
			e-five (persist-entity { :location { :x 701 :y 701 } :type "tree" :resource "tree.png" } )  
			close_e (get-close-entities 0 0)
		]
		(do 
			(is (= 2 (count close_e))))
			
  )) 

